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

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


# === Pydantic Models ===

class SignupRequest(BaseModel):
    """User signup request"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=200)


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
        
        # 2. Create tenant (status: onboarding)
        tenant_data = {
            "id": tenant_id,
            "email": body_request.email,  # Required by existing schema
            "status": "onboarding",
            "created_at": datetime.utcnow().isoformat()
        }
        
        db.client.table("tenants").insert(tenant_data).execute()
        
        # 3. Link user to tenant as owner
        tenant_user_data = {
            "tenant_id": tenant_id,
            "user_id": user_id,
            "role": "owner",
            "joined_at": datetime.utcnow().isoformat()
        }
        
        db.client.table("tenant_users").insert(tenant_user_data).execute()
        
        # 4. Create onboarding progress tracker
        onboarding_data = {
            "tenant_id": tenant_id,
            "stage_basic_info": False,
            "stage_compliance": False,
            "stage_intent": False,
            "started_at": datetime.utcnow().isoformat()
        }
        
        db.client.table("onboarding_progress").insert(onboarding_data).execute()
        
        # 5. Generate JWT token
        token_data = {
            "user_id": user_id,
            "tenant_id": tenant_id,
            "email": body_request.email,
            "role": "owner"
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
            onboarding_required=True,
            tenant_status="onboarding"
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
        "tenant_id, role"
    ).eq("user_id", user["id"]).order("joined_at").limit(1).execute()
    
    if not tenant_user_result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No tenant found for user"
        )
    
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
    
    tenant_status = tenant_result.data[0]["status"]
    
    # Generate JWT token
    token_data = {
        "user_id": user["id"],
        "tenant_id": tenant_id,
        "email": user["email"],
        "role": role
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
async def get_current_user():
    """
    Get current authenticated user info.
    
    TODO: Implement JWT verification middleware
    For now, this is a placeholder.
    """
    return {
        "message": "JWT verification not yet implemented",
        "note": "Use the token from signup/login in Authorization header"
    }


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
            "tenant_id, role"
        ).eq("user_id", user["id"]).order("joined_at").limit(1).execute()
        
        if not tenant_user_result.data:
            return RedirectResponse(f"{FRONTEND_CALLBACK_URL}?error=NoTenantFound")
            
        tenant_user = tenant_user_result.data[0]
        tenant_id = tenant_user["tenant_id"]
        role = tenant_user["role"]
        
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
        
        # Create tenant (upsert to handle cases where tenant email already exists)
        tenant_result = db.client.table("tenants").upsert({
            "id": tenant_id,
            "email": email,
            "status": "onboarding",
            "created_at": datetime.utcnow().isoformat()
        }, on_conflict="email").execute()
        
        # If tenant already existed, use its actual ID
        if tenant_result.data:
            tenant_id = tenant_result.data[0]["id"]
        
        # Link user to tenant (skip if already linked)
        try:
            db.client.table("tenant_users").insert({
                "tenant_id": tenant_id,
                "user_id": user_id,
                "role": "owner",
                "joined_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception:
            pass  # Already linked
        
        # Setup onboarding state (skip if already exists)
        try:
            db.client.table("onboarding_progress").insert({
                "tenant_id": tenant_id,
                "stage_basic_info": False,
                "stage_compliance": False,
                "stage_intent": False,
                "started_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception:
            pass  # Already exists
        
        tenant_status = "onboarding"
        role = "owner"

    # Generate Secure JWT
    token_data = {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "email": email,
        "role": role
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
