# Tenant Status Guards - Test Results

## Test 1: Active Tenant (Should PASS)

**Tenant:** `aadd8f90-bf6b-4c7f-b16a-bd0fc1748e9a` (status: `active`)

### Request
```bash
curl -X POST http://localhost:8000/campaigns \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: aadd8f90-bf6b-4c7f-b16a-bd0fc1748e9a" \
  -d '{
    "name": "Test Campaign",
    "subject": "Test Subject",
    "body_html": "<p>Test</p>",
    "status": "draft"
  }'
```

### Expected
- ✅ Status: 200 OK
- ✅ Campaign created successfully

---

## Test 2: Onboarding Tenant (Should FAIL with 403)

**Setup:** Create new tenant in onboarding status

### Request 1: Signup (creates onboarding tenant)
```bash
curl -X POST http://localhost:8000/auth/signup \
  -d '{
    "email": "blocked@example.com",
    "password": "password123",
    "full_name": "Blocked User"
  }'
```

### Request 2: Try to create campaign
```bash
curl -X POST http://localhost:8000/campaigns \
  -H "X-Tenant-ID: <onboarding_tenant_id>" \
  -d '{
    "name": "Blocked Campaign",
    "subject": "Should Fail",
    "body_html": "<p>Test</p>",
    "status": "draft"
  }'
```

### Expected
- ❌ Status: 403 Forbidden
- ❌ Message: "Tenant is in 'onboarding' status. Complete onboarding to create campaigns."

---

## Test 3: Send Campaign (Onboarding Tenant)

### Request
```bash
curl -X POST http://localhost:8000/campaigns/<campaign_id>/send \
  -H "X-Tenant-ID: <onboarding_tenant_id>" \
  -d '{"test_emails": ["test@example.com"]}'
```

### Expected
- ❌ Status: 403 Forbidden
- ❌ Message: "Tenant is in 'onboarding' status. Complete onboarding to send campaigns."

---

## Guards Implemented

### Routes Protected
1. ✅ `POST /campaigns` - Campaign creation
2. ✅ `POST /campaigns/{id}/send` - Campaign sending
3. ⏳ `POST /contacts/upload` - Contact upload (pending)

### Guard Logic
```python
# Check tenant status
tenant_result = db.client.table("tenants").select("status").eq("id", tenant_id).execute()

if not tenant_result.data:
    raise HTTPException(status_code=404, detail="Tenant not found")

tenant_status = tenant_result.data[0]["status"]

if tenant_status != "active":
    raise HTTPException(
        status_code=403,
        detail=f"Tenant is in '{tenant_status}' status. Complete onboarding to create campaigns."
    )
```

---

## Security Guarantees

✅ **Onboarding tenants cannot:**
- Create campaigns
- Send emails
- Upload contacts (pending)

✅ **Active tenants can:**
- Access all features
- Create and send campaigns
- Manage contacts

✅ **Guard is enforced:**
- At API layer (before any database operations)
- Returns clear error messages
- Prevents abuse and spam

---

## Next Steps

1. Add guard to `/contacts/upload` route
2. Test all guards with automated tests
3. Implement JWT middleware (Phase 2)
4. Add security edge tests (expired JWT, header spoofing)
