# Phase 4 — Campaign Orchestration: Complete Technical Audit

---

## Section 1 — What We Built

### 1.1 Campaign CRUD & State Machine

Campaigns are the central object in Phase 4. A campaign moves through a well-defined state machine managed by both Supabase (persistence) and Redis (live signals to workers).

**States:**
- `draft` → `scheduled` → `sending` → `sent`
- `sending` → `paused` → `sending` (resume)
- `sending` → `cancelled`

**Code Path:** `routes/campaigns.py`

**Key Design Decision: Separate Redis vs Supabase state**
- **Redis** stores `SENDING` / `PAUSED` / `CANCELLED` as a fast key-value for the worker to check on every message.
- **Supabase** stores the human-readable status for UI display and filtering.
- This means the worker can be paused in milliseconds (Redis write) without waiting for a DB round-trip.

### 1.2 Campaign Wizard (4-Step UI)

**Component Path:** `platform/client/src/components/CampaignWizard/Steps/`

The wizard is a single state object passed between steps, auto-saved to `localStorage` on every change:

```javascript
wizardData = {
  name: string,
  subject: string,
  listId: string,       // 'all' or 'batch:<uuid>'
  listName: string,     // display label
  templateName: string,
  htmlContent: string,
}
```

**State Persistence Pattern:** The wizard saves to `localStorage` on every field change, so the user never loses work on accidental refresh. On mount, the wizard checks `localStorage` and restores the draft.

### 1.3 Pre-Send Checklist

Implemented in `Step4Review.tsx`. The checklist is a computed array of `{ label, ok }` objects evaluated synchronously from `wizardData`. The "Launch Campaign" button has a hard `disabled` gate until all 4 checks pass:

```
✅ Campaign name set
✅ Subject line filled
✅ Content written
✅ Audience selected
```

### 1.4 Scheduled Sending Architecture

**Two-part system:**

| Part | What It Does | Where It Lives |
|------|-------------|----------------|
| `POST /campaigns/{id}/schedule` | Validates future date, sets `status='scheduled'` | `routes/campaigns.py` |
| Embedded Scheduler | Polls every 60s, dispatches due campaigns | Asyncio background task in `main.py` lifespan |

**Why embedded (not a separate process):**
Using FastAPI's `@asynccontextmanager` `lifespan`, the scheduler runs as a coroutine in the same event loop as the API. No extra terminal, no port conflicts, no inter-process communication needed.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(_run_scheduler())
    yield
    task.cancel()
```

### 1.5 Delete vs Archive Logic

| Status | Action | Reason |
|--------|--------|--------|
| `draft` | `DELETE FROM campaigns WHERE id=...` | No emails sent. No analytics impact. |
| Any other | `UPDATE campaigns SET is_archived=true` | Keeps unsubscribe links valid (CAN-SPAM). Preserves analytics. |

`GET /campaigns/` always filters `.is_("is_archived", "false")` so archived campaigns never appear in the UI.

---

## Section 2 — Security Review

### 2.1 Critical Security Controls

| Control | Status | Implementation |
|---------|--------|----------------|
| **Tenant Isolation** | ✅ Enforced | Every campaign query includes `.eq("tenant_id", tenant_id)` from JWT. |
| **Campaign Ownership** | ✅ Enforced | Pause/Resume/Cancel/Delete all verify ownership before taking action. |
| **Schedule Past Prevention** | ✅ Enforced | API validates `scheduled_dt <= datetime.now(UTC)` rejects with 400. |
| **Cancel on Already-Sent** | ✅ Handled | If all dispatch records are DISPATCHED, cancel marks campaign as 'sent' not 'cancelled'. |
| **Draft Delete Safety** | ✅ Enforced | Only `status='draft'` campaigns can be permanently deleted. |

### 2.2 Potential Risks

1. **Scheduler Double-Dispatch Risk:**
   - *Risk:* If two API instances run simultaneously (horizontal scaling), both schedulers could pick up the same campaign.
   - *Mitigation (Current):* The scheduler immediately updates `status='sending'` before dispatching. Second instance will see `status='sending'` and skip it.
   - *Production Fix:* Add `SELECT ... FOR UPDATE SKIP LOCKED` via a Supabase RPC to make this atomic at the DB level.

2. **`localStorage` Draft Exposure:**
   - *Risk:* Campaign drafts are stored in browser `localStorage`, which is accessible to any JS on the page (XSS risk).
   - *Mitigation:* The HTML content written is sanitized on the backend before storage. Frontend does not execute stored HTML.
   - *Production Fix:* Move draft auto-save to `POST /campaigns/` on each step (save as draft server-side).

3. **Unprotected Test Email Endpoint:**
   - *Risk:* `POST /campaigns/{id}/test` creates a temporary draft campaign. These temp drafts accumulate in the DB.
   - *Mitigation:* The temp drafts don't get dispatched to the real audience.
   - *Production Fix:* Add a cleanup cron to delete draft campaigns older than 24 hours with name prefix `[TEST]`.

---

## Section 3 — Edge Case Review

### 3.1 Cancel During Last Email
- **Scenario:** Worker is on the last email when user clicks Cancel.
- **Behavior:** The last email gets dispatched (already PROCESSING), then the worker calls the auto-complete check. The scheduler checks: 0 PENDING records remain → sets campaign to `sent`.
- **Cancel API response:** Returns `"status": "sent"` instead of `"cancelled"`, correctly reflecting reality.

### 3.2 Schedule in the Past
- **Scenario:** User somehow submits a `scheduled_at` time that's already passed.
- **Behavior:** Backend API checks `if scheduled_dt <= datetime.now(UTC)` → raises `HTTP 400`.
- **Result:** User sees an error immediately. Campaign is never created.

### 3.3 Pause with No Pending Emails
- **Scenario:** User clicks Pause after all emails are already DISPATCHED.
- **Behavior:** Redis is set to PAUSED. DB status set to `paused`. But on next worker check (auto-complete), it sees 0 PENDING records and updates to `sent`.
- **Result:** The campaign briefly shows `paused` then updates to `sent`. This is acceptable behavior.

### 3.4 Audience is Empty at Send Time
- **Scenario:** User selects a batch that has been cleared, then clicks Send.
- **Behavior:** `send_campaign()` queries contacts with the batch filter, gets 0 results → raises `HTTP 400 "No contacts found for audience"`.
- **Result:** Campaign remains as `draft`. No RabbitMQ tasks created.

### 3.5 Wizard Draft Conflict
- **Scenario:** User has a draft in `localStorage` from an old campaign and starts a new one.
- **Behavior:** Opening `/campaigns/new` loads localStorage data. The user will see the old name/subject pre-filled.
- **Mitigation:** The wizard shows the restored data clearly; user can overwrite.
- **Production Fix:** Key the localStorage by timestamp or prompt user "Restore previous draft?".

---

## Section 4 — Code Quality & Architecture

### 4.1 Architecture Score

| Category | Score | Reasoning |
|----------|-------|-----------|
| **Structure** | **8/10** | Campaign logic is contained in `campaigns.py`. The embedded scheduler adds a few lines to `main.py` but avoids a whole extra process. |
| **Reliability** | **8/10** | Redis + DB dual-state model is robust. The auto-complete logic correctly handles race conditions for small audiences. |
| **Scalability** | **7/10** | Single scheduler instance is fine for MVP. Needs distributed lock (Redis SETNX or Postgres FOR UPDATE SKIP LOCKED) for multi-instance production. |
| **UX Quality** | **9/10** | Wizard with localStorage persistence, pre-send checklist, and Send Now vs Schedule mode is a polished, complete user experience. |
| **Security** | **8/10** | Good tenant isolation. Minor risks around localStorage and temp test drafts (documented above). |

### 4.2 Technical Debt / TODOs

- [ ] **Distributed Scheduler Lock:** Use Redis `SETNX` or Postgres `FOR UPDATE SKIP LOCKED` before the scheduler dispatches, to safely support horizontal API scaling.
- [ ] **Server-side Draft Save:** Replace `localStorage` with auto-save to `POST /campaigns/` (save as draft) on each step change.
- [ ] **Test Draft Cleanup:** Cron to delete `[TEST]` draft campaigns older than 24 hours.
- [ ] **Resend to Unopened:** Requires Phase 6 (Open Tracking) to know who didn't open. Not buildable yet.
- [ ] **A/B Testing:** Split campaigns into variants — Phase 10.
- [ ] **Campaign Templates (Saved):** Save and reuse campaign settings — not yet implemented.

---

## Section 5 — Files Reference

### Backend (`platform/api`)

| File | Purpose | Key Functions |
|------|---------|---------------|
| `routes/campaigns.py` | All campaign endpoints | `create_campaign()`, `send_campaign()`, `schedule_campaign()`, `pause_campaign()`, `cancel_campaign()`, `delete_campaign()` |
| `main.py` | App startup + embedded scheduler | `_run_scheduler()`, `lifespan()` asyncio context |
| `utils/redis_client.py` | Campaign state via Redis | `set_campaign_status()`, `get_campaign_status()` |
| `utils/rabbitmq_client.py` | Message broker | `publish_tasks()` |

### Backend (`platform/worker`)

| File | Purpose | Key Functions |
|------|---------|---------------|
| `email_sender.py` | Async delivery worker | `process_message()`, `_inject_email_footer()`, auto-complete on last dispatch |

### Frontend (`platform/client`)

| File | Purpose |
|------|---------|
| `CampaignWizard/Steps/Step1Details.tsx` | Name + Subject form |
| `CampaignWizard/Steps/Step2Audience.tsx` | Audience selection (All / Batch) |
| `CampaignWizard/Steps/Step3Content.tsx` | HTML editor + template picker |
| `CampaignWizard/Steps/Step4Review.tsx` | Checklist + Send Now / Schedule Later |
| `app/campaigns/page.tsx` | Campaign list (Delete/Archive buttons) |
| `app/campaigns/[id]/page.tsx` | Campaign detail + Pause/Resume/Cancel |

---

## Section 6 — Final Verdict

**Phase 4 is ✅ COMPLETE for MVP scope.**

The campaign orchestration layer is fully functional: creation, wizard-guided setup, test email, scheduled sending (with embedded cron), live pause/resume/cancel via Redis, and a legally-safe archive pattern for sent campaigns. The system correctly auto-completes campaigns when all dispatches finish.

**Remaining items before a public launch:**
1. Distributed scheduler lock (for multi-instance deployment)
2. Server-side draft persistence (replaces localStorage)
3. Resend to Unopened (blocked on Phase 6 Open Tracking)
