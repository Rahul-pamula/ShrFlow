"""
TENANT NOTIFICATION SERVICE — Phase 7
Sends automated email notifications to tenant owners for key system events.

Events:
  1. Campaign completed → stats summary
  2. 80% quota reached → upgrade warning
  3. Monthly 1st → usage summary
  4. Bounce rate > 2% → list-cleaning alert
"""

import os
import logging
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

logger = logging.getLogger("email_engine.notifications")

SMTP_HOST = os.getenv("SMTP_HOST", "sandbox.smtp.mailtrap.io")
SMTP_PORT = int(os.getenv("SMTP_PORT", "2525"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@emailengine.io")
FROM_NAME = os.getenv("SMTP_FROM_NAME", "Email Engine")
APP_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")


def _base_template(title: str, body_html: str) -> str:
    """Shared dark-mode email template matching the platform's design."""
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Inter', -apple-system, sans-serif; background: #0F172A; color: #F1F5F9; padding: 40px; margin: 0;">
      <div style="max-width: 520px; margin: 0 auto; background: #1E293B; border-radius: 12px; padding: 32px; border: 1px solid #334155;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
          <span style="font-size: 20px; font-weight: 700; color: #F1F5F9;">📧 Email Engine</span>
        </div>
        <h2 style="margin: 0 0 16px; color: #F1F5F9; font-size: 18px;">{title}</h2>
        {body_html}
        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;">
        <p style="color: #64748B; font-size: 11px; margin: 0;">
          This is an automated notification from your Email Engine platform.<br>
          <a href="{APP_URL}/settings/billing" style="color: #3B82F6;">Manage your notifications</a>
        </p>
      </div>
    </body>
    </html>
    """


async def _send_notification(to_email: str, subject: str, html: str):
    """Push to Centralized Mailer Queue using raw HTML."""
    from services.email_service import send_raw_html
    
    success = await send_raw_html(to_email, subject, html)
    if success:
        logger.info(f"[NOTIFY QUEUED] Sent notification to {to_email}: {subject}")
        return True
    else:
        logger.error(f"[NOTIFY QUEUE ERROR] Failed to push to {to_email}")
        return False


# ═══════════════════════════════════════════════════════════════════════
# 1. CAMPAIGN COMPLETED
# ═══════════════════════════════════════════════════════════════════════
async def notify_campaign_completed(
    tenant_email: str,
    campaign_name: str,
    total_sent: int,
    total_failed: int,
    campaign_id: str
):
    """Notify tenant that their campaign has finished sending."""
    success_rate = round((total_sent / max(total_sent + total_failed, 1)) * 100, 1)
    body = f"""
    <p style="color: #94A3B8; line-height: 1.6;">
      Your campaign <strong style="color: #F1F5F9;">"{campaign_name}"</strong> has finished sending.
    </p>
    <div style="background: #0F172A; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse; color: #CBD5E1; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0;">✅ Delivered</td>
          <td style="text-align: right; font-weight: 600; color: #10B981;">{total_sent:,}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0;">❌ Failed</td>
          <td style="text-align: right; font-weight: 600; color: #EF4444;">{total_failed:,}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; border-top: 1px solid #334155;">📊 Success Rate</td>
          <td style="text-align: right; font-weight: 600; color: #3B82F6; border-top: 1px solid #334155;">{success_rate}%</td>
        </tr>
      </table>
    </div>
    <a href="{APP_URL}/campaigns/{campaign_id}"
       style="display: inline-block; padding: 10px 20px; background: #3B82F6; color: white;
              text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
      View Campaign Report →
    </a>
    """
    html = _base_template("Campaign Completed 🎉", body)
    await _send_notification(tenant_email, f"✅ Campaign '{campaign_name}' — Sending Complete", html)


# ═══════════════════════════════════════════════════════════════════════
# 2. QUOTA 80% WARNING
# ═══════════════════════════════════════════════════════════════════════
async def notify_quota_warning(
    tenant_email: str,
    emails_used: int,
    email_limit: int,
    plan_name: str
):
    """Notify tenant they've used 80%+ of their monthly email quota."""
    pct = round((emails_used / max(email_limit, 1)) * 100)
    remaining = max(email_limit - emails_used, 0)
    body = f"""
    <p style="color: #94A3B8; line-height: 1.6;">
      You've used <strong style="color: #F59E0B;">{pct}%</strong> of your monthly email quota
      on the <strong style="color: #F1F5F9;">{plan_name}</strong> plan.
    </p>
    <div style="background: #0F172A; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <div style="display: flex; justify-content: space-between; color: #CBD5E1; font-size: 14px; margin-bottom: 8px;">
        <span>{emails_used:,} / {email_limit:,} emails</span>
        <span style="color: #F59E0B; font-weight: 600;">{pct}%</span>
      </div>
      <div style="height: 6px; background: #334155; border-radius: 3px; overflow: hidden;">
        <div style="height: 100%; width: {min(pct, 100)}%; background: #F59E0B; border-radius: 3px;"></div>
      </div>
      <p style="color: #94A3B8; font-size: 13px; margin: 10px 0 0;">
        You have <strong>{remaining:,}</strong> emails remaining this billing cycle.
      </p>
    </div>
    <a href="{APP_URL}/settings/billing"
       style="display: inline-block; padding: 10px 20px; background: #F59E0B; color: #0F172A;
              text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
      Upgrade Your Plan →
    </a>
    """
    html = _base_template("⚠️ Quota Warning", body)
    await _send_notification(tenant_email, f"⚠️ You've used {pct}% of your email quota", html)


# ═══════════════════════════════════════════════════════════════════════
# 3. MONTHLY USAGE SUMMARY
# ═══════════════════════════════════════════════════════════════════════
async def notify_monthly_summary(
    tenant_email: str,
    emails_sent: int,
    email_limit: int,
    contacts_count: int,
    campaigns_count: int,
    plan_name: str,
    month_label: str  # e.g. "February 2026"
):
    """Monthly 1st summary email with usage stats."""
    body = f"""
    <p style="color: #94A3B8; line-height: 1.6;">
      Here's your <strong style="color: #F1F5F9;">{month_label}</strong> usage summary
      on the <strong>{plan_name}</strong> plan.
    </p>
    <div style="background: #0F172A; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse; color: #CBD5E1; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0;">📤 Emails Sent</td>
          <td style="text-align: right; font-weight: 600; color: #3B82F6;">{emails_sent:,} / {email_limit:,}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">👥 Total Contacts</td>
          <td style="text-align: right; font-weight: 600; color: #10B981;">{contacts_count:,}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">📨 Campaigns Launched</td>
          <td style="text-align: right; font-weight: 600; color: #8B5CF6;">{campaigns_count:,}</td>
        </tr>
      </table>
    </div>
    <p style="color: #64748B; font-size: 13px;">
      Your quota resets at the start of each billing cycle.
    </p>
    <a href="{APP_URL}/dashboard"
       style="display: inline-block; padding: 10px 20px; background: #3B82F6; color: white;
              text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
      View Dashboard →
    </a>
    """
    html = _base_template(f"📊 {month_label} Usage Summary", body)
    await _send_notification(tenant_email, f"📊 Your {month_label} Email Engine Summary", html)


# ═══════════════════════════════════════════════════════════════════════
# 4. BOUNCE RATE ALERT
# ═══════════════════════════════════════════════════════════════════════
async def notify_bounce_alert(
    tenant_email: str,
    bounce_rate: float,
    campaign_name: str,
    campaign_id: str
):
    """Alert tenant that bounce rate has exceeded safe threshold."""
    pct = round(bounce_rate * 100, 1)
    body = f"""
    <p style="color: #94A3B8; line-height: 1.6;">
      Your campaign <strong style="color: #F1F5F9;">"{campaign_name}"</strong> has been
      <strong style="color: #EF4444;">automatically paused</strong> due to a high bounce rate.
    </p>
    <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #FCA5A5; font-size: 14px; margin: 0 0 8px;">
        🚨 Rolling bounce rate: <strong>{pct}%</strong> (threshold: 5%)
      </p>
      <p style="color: #94A3B8; font-size: 13px; margin: 0;">
        High bounce rates damage your sender reputation and can cause your emails to land in spam.
        We recommend cleaning your contact list before resuming.
      </p>
    </div>
    <p style="color: #94A3B8; font-size: 14px; font-weight: 600;">Recommended actions:</p>
    <ol style="color: #CBD5E1; font-size: 13px; line-height: 1.8; padding-left: 20px;">
      <li>Review your <a href="{APP_URL}/contacts/suppression" style="color: #3B82F6;">suppression list</a></li>
      <li>Remove invalid or outdated email addresses</li>
      <li>Consider using double opt-in for new subscribers</li>
    </ol>
    <a href="{APP_URL}/campaigns/{campaign_id}"
       style="display: inline-block; padding: 10px 20px; background: #EF4444; color: white;
              text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
      Review Campaign →
    </a>
    """
    html = _base_template("🚨 High Bounce Rate Detected", body)
    await _send_notification(tenant_email, f"🚨 Campaign '{campaign_name}' paused — {pct}% bounce rate", html)
