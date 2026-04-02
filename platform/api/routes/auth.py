"""
AUTHENTICATION ROUTES
Progressive Tenant Onboarding System

Features:
- User signup with email/password
- User login with JWT token generation
- Automatic tenant creation on signup
- Password hashing with bcrypt
- JWT-based authentication
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid
import os
import httpx

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Import the global limiter from shared module
from utils.rate_limiter import limiter
from utils.jwt_middleware import require_authenticated_user, JWTPayload


# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

PUBLIC_EMAIL_PROVIDERS = [
    "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", 
    "icloud.com", "aol.com", "protonmail.com", "zoho.com"
]

def get_verified_domain_tenant(email: str) -> Optional[str]:
    """Check if the email belongs to a verified enterprise domain."""
    from utils.supabase_client import db
    try:
        domain = email.split('@')[1].lower()
        if domain in PUBLIC_EMAIL_PROVIDERS:
            return None
            
        res = db.client.table("domains").select("tenant_id").eq("domain_name", domain).eq("status", "verified").execute()
        if res.data and len(res.data) > 0:
            return res.data[0]["tenant_id"]
    except Exception:
        pass
    return None


async def notify_workspace_owners(tenant_id: str, requester_email: str):
    """Notify users with 'owner' or 'admin' roles that a new user requested access."""
    from utils.supabase_client import db
    from services.email_service import send_access_request_notification
    try:
        # Get workspace name
        t_res = db.client.table("tenants").select("company_name").eq("id", tenant_id).execute()
        workspace_name = t_res.data[0].get("company_name", "Your Team") if t_res.data else "Your Team"
        
        # Get owners/admins
        owners_res = db.client.table("tenant_users").select("user_id").eq("tenant_id", tenant_id).in_("role", ["owner", "admin"]).execute()
        if not owners_res.data:
            return
            
        owner_ids = [o["user_id"] for o in owners_res.data]
        users_res = db.client.table("users").select("email").in_("id", owner_ids).execute()
        
        # Dispatch emails
        emails = [u["email"] for u in (users_res.data or []) if u.get("email")]
        for email in emails:
            await send_access_request_notification(email, requester_email, workspace_name)
            
    except Exception as e:
        print(f"[JIT Notification Error] {e}")


# === Pydantic Models ===

VALID_THEMES = {"light", "dark", "system"}


class SignupRequest(BaseModel):
    """User signup request"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=200)
    tenant_name: Optional[str] = None  # Optional: if absent, user is joining via invite


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Authentication response"""
    user_id: str
    tenant_id: str
    token: str
    onboarding_required: bool
    tenant_status: str


class SwitchWorkspaceRequest(BaseModel):
    """Request to switch to a different workspace"""
    tenant_id: str


class ThemeUpdateRequest(BaseModel):
    """Request to update the user's theme preference"""
    theme: str = Field(..., description="Must be one of: light, dark, system")


# === Helper Functions ===

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


# === Routes ===

@router.post("/signup", response_model=AuthResponse)
@limiter.limit("5/minute")
async def signup(request: Request, body_request: SignupRequest):
    """
    Create a new user account and tenant.
    
    Flow:
    1. Validate email uniqueness
    2. Hash password
    3. Create user record
    4. Create tenant record (status: 'onboarding')
    5. Link user to tenant as owner
    6. Generate JWT token
    7. Return token + tenant info
    """
    from utils.supabase_client import db
    
    # Check if email already exists
    existing_user = db.client.table("users").select("id").eq("email", body_request.email).execute()
    
    if existing_user.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate IDs
    user_id = str(uuid.uuid4())
    tenant_id = str(uuid.uuid4())
    
    # Hash password
    password_hash = hash_password(body_request.password)
    
    try:
        # 1. Create user
        user_data = {
            "id": user_id,
            "email": body_request.email,
            "password_hash": password_hash,
            "full_name": body_request.full_name,
            "email_verified": False,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        
        db.client.table("users").insert(user_data).execute()
        
        # 2. Check if this is an invited user (no tenant_name provided)
        if not body_request.tenant_name:
            # Invited user: don't create a new workspace.
            # They'll be added to the correct workspace when they call /team/invites/accept
            # Use a placeholder tenant row only for JWT payload; real tenant assigned after accept.
            tenant_status = "pending_join"
            role = "invited_pending"
            # We need a dummy tenant_id for the JWT — just use a zero UUID
            tenant_id = "00000000-0000-0000-0000-000000000000"
        
        # 3. Check for Enterprise JIT Auto-Discovery
        elif jit_tenant_id := get_verified_domain_tenant(body_request.email):
            tenant_id = jit_tenant_id
            
            # Create a Join Request instead of a new tenant
            db.client.table("join_requests").insert({
                "user_id": user_id,
                "tenant_id": tenant_id,
                "status": "pending",
                "risk_score": "Low Risk"
            }).execute()
            
            # Blast notification to Workspace Owners
            await notify_workspace_owners(tenant_id, body_request.email)
            
            tenant_status = "pending_join"
            role = "pending"
        else:
            # Normal isolated tenant creation (status: onboarding)
            tenant_data = {
                "id": tenant_id,
                "email": body_request.email,  # Required by existing schema
                "status": "onboarding",
                "created_at": datetime.utcnow().isoformat()
            }
            db.client.table("tenants").insert(tenant_data).execute()
            
            # Link user to tenant as owner
            tenant_user_data = {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "role": "owner",
                "joined_at": datetime.utcnow().isoformat()
            }
            db.client.table("tenant_users").insert(tenant_user_data).execute()
            
            # Create onboarding progress tracker
            onboarding_data = {
                "tenant_id": tenant_id,
                "stage_basic_info": False,
                "stage_compliance": False,
                "stage_intent": False,
                "started_at": datetime.utcnow().isoformat()
            }
            db.client.table("onboarding_progress").insert(onboarding_data).execute()
            
            tenant_status = "onboarding"
            role = "owner"
        
        # 5. Generate JWT token
        token_data = {
            "user_id": user_id,
            "tenant_id": tenant_id,
            "email": body_request.email,
            "role": role,
            "isolation_model": "team"
        }
        
        access_token = create_access_token(token_data)
        
        # 6. Update last login
        db.client.table("users").update({
            "last_login_at": datetime.utcnow().isoformat()
        }).eq("id", user_id).execute()
        
        # 7. Send email verification link
        from services.email_service import send_email_verification
        import secrets
        
        verify_token = secrets.token_hex(64)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
        db.client.table("email_verification_tokens").insert({
            "user_id": user_id,
            "token": verify_token,
            "expires_at": expires_at.isoformat(),
        }).execute()
        
        # Fire and forget sending email
        await send_email_verification(body_request.email, verify_token)
        
        return AuthResponse(
            user_id=user_id,
            tenant_id=tenant_id,
            token=access_token,
            onboarding_required=(tenant_status == "onboarding"),
            tenant_status=tenant_status
        )
        
    except Exception as e:
        # Rollback: Delete created records if any step fails
        # Note: In production, use database transactions
        try:
            db.client.table("tenant_users").delete().eq("user_id", user_id).execute()
            db.client.table("tenants").delete().eq("id", tenant_id).execute()
            db.client.table("users").delete().eq("id", user_id).execute()
        except:
            pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create account: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login(request: Request, body_request: LoginRequest):
    """
    Authenticate an existing user.
    
    Flow:
    1. Verify email exists
    2. Verify password
    3. Get user's primary tenant
    4. Generate JWT token
    5. Return token + tenant info
    
    MULTI-TENANT HANDLING:
    - Currently returns user's FIRST tenant (by join date)
    - Future: Add /auth/switch-tenant endpoint
    - Future: Add tenant picker UI for users with multiple tenants
    - For now: Most users have one tenant (owner of their org)
    """
    from utils.supabase_client import db
    
    # Get user by email
    user_result = db.client.table("users").select("*").eq("email", body_request.email).execute()
    
    if not user_result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user = user_result.data[0]
    
    # Verify password
    if not verify_password(body_request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )
    
    # Get user's primary tenant (first tenant they're a member of)
    # TODO: When implementing multi-tenant support, add tenant selection logic
    tenant_user_result = db.client.table("tenant_users").select(
        "tenant_id, role, isolation_model"
    ).eq("user_id", user["id"]).order("joined_at").limit(1).execute()
    
    if not tenant_user_result.data:
        # Check if they are in the waiting room
        join_req_result = db.client.table("join_requests").select("tenant_id, status").eq("user_id", user["id"]).execute()
        
        if not join_req_result.data:
            # Check if they have a pending team invitation by email (not yet accepted)
            invite_res = db.client.table("team_invitations").select("tenant_id").eq("email", user["email"]).execute()
            if invite_res.data:
                # They have a pending invite but haven't accepted yet
                # Give them a minimal JWT so they can hit /team/invites/accept
                tenant_id = invite_res.data[0]["tenant_id"]
                role = "invited_pending"
                tenant_status = "pending_join"
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="No assigned workspace or pending requests found for user"
                )
        else:
            join_req = join_req_result.data[0]
            tenant_id = join_req["tenant_id"]
            role = "pending"
            
            if join_req["status"] == "blocked":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your request to join this workspace was denied by the administrator."
                )
            
            tenant_status = "pending_join"
    else:
        tenant_user = tenant_user_result.data[0]
        tenant_id = tenant_user["tenant_id"]
        role = tenant_user["role"]
    
    # Get tenant status
    tenant_result = db.client.table("tenants").select("status").eq("id", tenant_id).execute()
    
    if not tenant_result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tenant not found"
        )
    
    if role == "pending":
        tenant_status = "pending_join"
        isolation_model = "team"
    else:
        tenant_status = tenant_result.data[0]["status"]
        isolation_model = tenant_user.get("isolation_model", "team")
    
    # Generate JWT token
    token_data = {
        "user_id": user["id"],
        "tenant_id": tenant_id,
        "email": user["email"],
        "role": role,
        "isolation_model": isolation_model
    }
    
    access_token = create_access_token(token_data)
    
    # Update last login
    db.client.table("users").update({
        "last_login_at": datetime.utcnow().isoformat()
    }).eq("id", user["id"]).execute()
    
    return AuthResponse(
        user_id=user["id"],
        tenant_id=tenant_id,
        token=access_token,
        onboarding_required=(tenant_status == "onboarding"),
        tenant_status=tenant_status
    )


@router.get("/me")
async def get_current_user(jwt_payload: JWTPayload = Depends(require_authenticated_user)):
    """
    Get current authenticated user info, including stored theme preference.
    This is called on app load to hydrate the frontend session and sync theme.
    """
    from utils.supabase_client import db

    user_result = db.client.table("users").select(
        "id, email, full_name, email_verified, is_active, created_at, last_login_at, theme_preference"
    ).eq("id", jwt_payload.user_id).execute()

    if not user_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user = user_result.data[0]
    return {
        "user_id": user["id"],
        "email": user["email"],
        "full_name": user.get("full_name"),
        "email_verified": user.get("email_verified", False),
        "theme_preference": user.get("theme_preference") or "system",
        "tenant_id": jwt_payload.tenant_id,
        "role": jwt_payload.role,
    }


@router.patch("/me/theme")
@limiter.limit("10/minute")
async def update_theme_preference(
    request: Request,
    body: ThemeUpdateRequest,
    jwt_payload: JWTPayload = Depends(require_authenticated_user),
):
    """
    Update the authenticated user's theme preference.

    Security:
    - Requires valid JWT
    - Strictly validates against allowed values (light | dark | system)
    - Idempotency: skips DB write if value hasn't changed
    - Rate limited to 10 requests/min per user
    """
    from utils.supabase_client import db

    # Strict whitelist validation — never trust client-supplied strings
    if body.theme not in VALID_THEMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid theme. Must be one of: {', '.join(sorted(VALID_THEMES))}",
        )

    # Idempotency: fetch current value, skip write if unchanged
    user_result = db.client.table("users").select("theme_preference").eq("id", jwt_payload.user_id).execute()
    if not user_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    current = user_result.data[0].get("theme_preference") or "system"
    if current == body.theme:
        return {"status": "no_change", "theme_preference": current}

    # Persist the validated theme value
    db.client.table("users").update({"theme_preference": body.theme}).eq("id", jwt_payload.user_id).execute()

    return {"status": "updated", "theme_preference": body.theme}

@router.get("/workspaces")
async def get_user_workspaces(jwt_payload: JWTPayload = Depends(require_authenticated_user)):
    """Get all workspaces the authenticated user belongs to."""
    from utils.supabase_client import db
    
    # Get all tenant links for this user
    links = db.client.table("tenant_users").select("tenant_id, role, isolation_model").eq("user_id", jwt_payload.user_id).execute()
    if not links.data:
        return []
        
    tenant_ids = [row["tenant_id"] for row in links.data]
    roles_by_tenant = {row["tenant_id"]: row["role"] for row in links.data}
    
    # Get tenant details
    tenants = db.client.table("tenants").select("id, company_name, status").in_("id", tenant_ids).execute()
    
    results = []
    for t in (tenants.data or []):
        results.append({
            "tenant_id": t["id"],
            "company_name": t.get("company_name") or "Unnamed Workspace",
            "role": roles_by_tenant.get(t["id"]),
            "status": t.get("status")
        })
        
    return results


@router.post("/switch-workspace", response_model=AuthResponse)
async def switch_workspace(
    body: SwitchWorkspaceRequest,
    jwt_payload: JWTPayload = Depends(require_authenticated_user)
):
    """Switch to a different workspace and receive a new JWT token."""
    from utils.supabase_client import db
    
    # Verify the user is actually a member of the requested tenant
    link = db.client.table("tenant_users").select("role, isolation_model").eq("user_id", jwt_payload.user_id).eq("tenant_id", body.tenant_id).execute()
    
    if not link.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this workspace."
        )
        
    role = link.data[0]["role"]
    isolation_model = link.data[0].get("isolation_model", "team")
    
    # Get tenant status to ensure it's not suspended
    tenant = db.client.table("tenants").select("status").eq("id", body.tenant_id).execute()
    if not tenant.data:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    tenant_status = tenant.data[0]["status"]
    
    # Generate new JWT token scoped to this tenant
    token_data = {
        "user_id": jwt_payload.user_id,
        "tenant_id": body.tenant_id,
        "email": jwt_payload.email,
        "role": role,
        "isolation_model": isolation_model
    }
    
    access_token = create_access_token(token_data)
    
    return AuthResponse(
        user_id=jwt_payload.user_id,
        tenant_id=body.tenant_id,
        token=access_token,
        onboarding_required=(tenant_status == "onboarding"),
        tenant_status=tenant_status
    )


# === OAuth Routes ===

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# The redirect URI registered in Google Console pointing to our backend
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/auth/github/callback")

FRONTEND_CALLBACK_URL = os.getenv("FRONTEND_CALLBACK_URL", "http://localhost:3000/auth/callback")


@router.get("/google/login")
async def google_login():
    """Redirect user to Google Consent Screen"""
    if not GOOGLE_CLIENT_ID:
        # We redirect back to frontend with error so the UI handles it gracefully
        return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?error=GoogleNotConfigured")
    
    url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={GOOGLE_CLIENT_ID}&redirect_uri={GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile"
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str):
    """Handle Google OAuth Callback"""
    async with httpx.AsyncClient() as client:
        # 1. Exchange code for access token
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": GOOGLE_REDIRECT_URI,
            }
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?error=GoogleAuthFailed")
            
        # 2. Fetch User Profile
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_info = user_res.json()
        email = user_info.get("email")
        full_name = user_info.get("name", "")
        
        if not email:
            return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?error=NoEmailFound")

    # 3. Create or Log In User
    return await process_oauth_user(email, full_name, "google")


@router.get("/github/login")
async def github_login():
    """Redirect to GitHub Authorization"""
    if not GITHUB_CLIENT_ID:
        return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?error=GitHubNotConfigured")
        
    url = f"https://github.com/login/oauth/authorize?client_id={GITHUB_CLIENT_ID}&redirect_uri={GITHUB_REDIRECT_URI}&scope=user:email"
    return RedirectResponse(url)


@router.get("/github/callback")
async def github_callback(code: str):
    """Handle GitHub OAuth Callback"""
    async with httpx.AsyncClient() as client:
        # 1. Exchange code for token
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
            headers={"Accept": "application/json"}
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        
        if not access_token:
            return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?error=GitHubAuthFailed")
            
        # 2. Get user info
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        )
        user_info = user_res.json()
        full_name = user_info.get("name") or user_info.get("login") or ""
        
        # GitHub might return a private email -> fetch explicit emails list
        email = user_info.get("email")
        if not email:
            emails_res = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
            )
            emails = emails_res.json()
            primary_email = next((e["email"] for e in emails if e["primary"] and e["verified"]), None)
            if not primary_email and len(emails) > 0:
                primary_email = emails[0]["email"]
            email = primary_email

        if not email:
            return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?error=NoEmailFound")

    # 3. Create or Log In User
    return await process_oauth_user(email, full_name, "github")


async def process_oauth_user(email: str, full_name: str, provider: str):
    """Shared logic used by all OAuth providers to provision UI sessions"""
    from utils.supabase_client import db
    
    # 1. Check if user exists
    user_result = db.client.table("users").select("*").eq("email", email).execute()
    
    if user_result.data:
        # EXISTING USER -> log them in
        user = user_result.data[0]
        
        if not user.get("is_active", True):
            return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?error=AccountDisabled")
            
        # Get their primary tenant
        tenant_user_result = db.client.table("tenant_users").select(
            "tenant_id, role, isolation_model"
        ).eq("user_id", user["id"]).order("joined_at").limit(1).execute()
        
        if not tenant_user_result.data:
            # Check waiting room
            join_req_result = db.client.table("join_requests").select("tenant_id, status").eq("user_id", user["id"]).execute()
            if not join_req_result.data:
                return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?error=NoTenantFound")
                
            join_req = join_req_result.data[0]
            tenant_id = join_req["tenant_id"]
            role = "pending"
            tenant_status = "pending_join"
            
            if join_req["status"] == "blocked":
                return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?error=AccountBlocked")
        else:
            tenant_user = tenant_user_result.data[0]
            tenant_id = tenant_user["tenant_id"]
            role = tenant_user["role"]
            isolation_model = tenant_user.get("isolation_model", "team")
            
            tenant_result = db.client.table("tenants").select("status").eq("id", tenant_id).execute()
            tenant_status = tenant_result.data[0]["status"] if tenant_result.data else "active"
        
        user_id = user["id"]
    else:
        # NEW USER -> create their account and an isolated tenant automatically
        user_id = str(uuid.uuid4())
        tenant_id = str(uuid.uuid4())
        
        # Generate random password since they use OAuth
        import secrets
        password_hash = hash_password(secrets.token_urlsafe(32))
        
        # Create user
        db.client.table("users").insert({
            "id": user_id,
            "email": email,
            "password_hash": password_hash,
            "full_name": full_name,
            "email_verified": True, # OAuth emails are inherently verified
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        # Check for Enterprise JIT Auto-Discovery
        jit_tenant_id = get_verified_domain_tenant(email)
        
        if jit_tenant_id:
            tenant_id = jit_tenant_id
            
            db.client.table("join_requests").insert({
                "user_id": user_id,
                "tenant_id": tenant_id,
                "status": "pending",
                "risk_score": "Low Risk"
            }).execute()
            
            # Blast notification to Workspace Owners
            await notify_workspace_owners(tenant_id, email)
            
            tenant_status = "pending_join"
            role = "pending"
        else:
            tenant_id = str(uuid.uuid4())
            # Create isolated tenant
            tenant_result = db.client.table("tenants").upsert({
                "id": tenant_id,
                "email": email,
                "status": "onboarding",
                "created_at": datetime.utcnow().isoformat()
            }, on_conflict="email").execute()
            
            if tenant_result.data:
                tenant_id = tenant_result.data[0]["id"]
            
            try:
                db.client.table("tenant_users").insert({
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "role": "owner",
                    "joined_at": datetime.utcnow().isoformat()
                }).execute()
            except Exception:
                pass
            
            try:
                db.client.table("onboarding_progress").insert({
                    "tenant_id": tenant_id,
                    "stage_basic_info": False,
                    "stage_compliance": False,
                    "stage_intent": False,
                    "started_at": datetime.utcnow().isoformat()
                }).execute()
            except Exception:
                pass
            
            tenant_status = "onboarding"
            role = "owner"

    # Generate Secure JWT
    isolation_model = locals().get("isolation_model", "team")
    token_data = {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "email": email,
        "role": role,
        "isolation_model": isolation_model
    }
    
    access_token = create_access_token(token_data)
    
    # Update last login timestamp
    db.client.table("users").update({
        "last_login_at": datetime.utcnow().isoformat()
    }).eq("id", user_id).execute()
    
    # Finally, redirect back to NEXT.JS with the secure JWT parameter
    from urllib.parse import urlencode
    
    # Encode params safely
    params = urlencode({
        "token": access_token,
        "tenant_status": tenant_status,
        "user_id": user_id,
        "email": email,
        "full_name": full_name,
        "tenant_id": tenant_id,
        "role": role
    })
    
    return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?{params}")
