# Database Migration Execution Guide

## 🎯 Step 1: Run SQL Migration in Supabase

### Instructions

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Navigate to your project: `email_engine`
   - Click **SQL Editor** in left sidebar

2. **Execute Migration**
   - Click **New Query**
   - Copy the entire contents of [`002_progressive_onboarding.sql`](file:///Users/pamula/Desktop/email_engine/platform/database/migrations/002_progressive_onboarding.sql)
   - Paste into SQL Editor
   - Click **Run** (or press Cmd+Enter)

3. **Verify Tables Created**
   ```sql
   -- Run this query to verify:
   SELECT 
       table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
   FROM information_schema.tables t
   WHERE table_schema = 'public' 
   AND table_name IN ('users', 'tenants', 'tenant_users', 'onboarding_progress')
   ORDER BY table_name;
   ```

   **Expected Output:**
   ```
   table_name            | column_count
   ----------------------|-------------
   onboarding_progress   | 9
   tenant_users          | 5
   tenants               | 20+
   users                 | 9
   ```

4. **Check Existing Data**
   ```sql
   -- Verify tenants table was enhanced (not recreated)
   SELECT id, status, organization_name, created_at 
   FROM tenants 
   LIMIT 5;
   ```

---

## 🧪 Step 2: Test Auth Endpoints

### Test 1: Signup

**Request:**
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123",
    "full_name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "token": "eyJ...",
  "onboarding_required": true,
  "tenant_status": "onboarding"
}
```

**Verify in Database:**
```sql
SELECT * FROM users WHERE email = 'test@example.com';
SELECT * FROM tenants WHERE id = '<tenant_id_from_response>';
SELECT * FROM tenant_users WHERE user_id = '<user_id_from_response>';
```

---

### Test 2: Login

**Request:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123"
  }'
```

**Expected Response:**
```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "token": "eyJ...",
  "onboarding_required": true,
  "tenant_status": "onboarding"
}
```

---

### Test 3: JWT Verification

**Request (No Token):**
```bash
curl -X GET http://localhost:8000/onboarding/status \
  -H "X-Tenant-ID: <tenant_id>"
```

**Expected:** `401 Unauthorized` (when JWT middleware is applied)

---

### Test 4: Onboarding Flow

**Get Status:**
```bash
curl -X GET http://localhost:8000/onboarding/status \
  -H "X-Tenant-ID: <tenant_id>"
```

**Update Basic Info:**
```bash
curl -X PUT http://localhost:8000/onboarding/basic-info \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant_id>" \
  -d '{
    "organization_name": "Acme Corp",
    "country": "US",
    "timezone": "America/New_York"
  }'
```

**Update Compliance:**
```bash
curl -X PUT http://localhost:8000/onboarding/compliance \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <tenant_id>" \
  -d '{
    "address_line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "country": "US",
    "zip": "10001"
  }'
```

**Complete Onboarding:**
```bash
curl -X POST http://localhost:8000/onboarding/complete \
  -H "X-Tenant-ID: <tenant_id>"
```

**Verify Activation:**
```sql
SELECT id, status, organization_name, onboarding_completed_at 
FROM tenants 
WHERE id = '<tenant_id>';
```

**Expected:** `status = 'active'`

---

## 🚧 Step 3: Test Tenant Status Guards

### Test Campaign Creation (Onboarding Tenant)

**Create a new tenant in onboarding:**
```bash
# Use signup to create new tenant
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "blocked@example.com",
    "password": "password123",
    "full_name": "Blocked User"
  }'
```

**Try to create campaign:**
```bash
curl -X POST http://localhost:8000/campaigns \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: <onboarding_tenant_id>" \
  -d '{
    "name": "Test Campaign",
    "subject": "Test",
    "body_html": "<p>Test</p>",
    "status": "draft"
  }'
```

**Expected (when guard is applied):** 
```json
{
  "detail": "Tenant is in 'onboarding' status. Complete onboarding to access this feature."
}
```

### Test After Activation

**Activate tenant manually:**
```sql
UPDATE tenants 
SET status = 'active', onboarding_completed_at = NOW() 
WHERE id = '<tenant_id>';
```

**Retry campaign creation:**
```bash
# Same curl command as above
```

**Expected:** `200 OK` with campaign created

---

## ✅ Success Criteria

After completing all tests:

- [x] All 4 tables exist in Supabase
- [x] Signup creates user + tenant atomically
- [x] Login returns JWT with tenant_id
- [x] Onboarding flow updates tenant correctly
- [x] Tenant activation changes status to 'active'
- [x] Guards block onboarding tenants (when implemented)
- [x] Guards allow active tenants

---

## 📝 Notes

- **JWT Middleware**: Currently not applied to all routes (Phase 1)
- **Tenant Guards**: Need to be added to campaign routes
- **Multi-Tenant**: Currently returns first tenant on login

**Next:** After backend tests pass, implement frontend signup flow.
