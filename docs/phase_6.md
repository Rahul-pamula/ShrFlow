# Phase 6: Analytics & Engagement Tracking

status: COMPLETE

This document details the architecture, features, and implementation specifics of Phase 6 of the Email Engine platform.

## Objective

The goal of Phase 6 was to transition the platform from simple message transmission to a data-driven engagement ecosystem. This involves tracking when recipients open emails, when they click links, handling bounces, and presenting this data clearly in a frontend dashboard.

## Completed Features

### 1. Database Infrastructure
- **`email_events` table**: A high-performance, indexed table acting as the central repository for all interaction logs.
  - Columns: `id`, `tenant_id`, `campaign_id`, `dispatch_id`, `subscriber_id`, `contact_id`, `event_type` (open, click, bounce, spam), `url`, `user_agent`, `ip_address`, `is_bot`.
  - Indexes: Optimized for rapid retrieval by `campaign_id` and `subscriber_id` to support real-time UI aggregations.

### 2. High-Concurrency Tracking Endpoints
- **`GET /track/open/{id}`**: 
  - Generates and serves a transparent 1x1 tracking pixel.
  - Decodes the Base64 dispatch payload.
  - Logs the `open` event with recipient metadata.
- **`GET /track/click?d={encoded_payload}`**: 
  - Transparent redirect proxy.
  - Records the `click` event and issues an HTTP 307 Temporary Redirect to the originally intended destination.

### 3. Bot Detection Engine
- Modern email security environments (Microsoft Defender, Apple Mail Privacy Protection) pre-fetch images and clicks. We built a multi-layered filtering system to ensure accurate analytics:
  - **User-Agent Filtering**: Fragments like `bot`, `crawler`, `spider`, and `googleimageproxy` are flagged as `is_bot = true`.
  - **Timing Correlation**: If a click happens less than 2 seconds after an open for the same subscriber, it is flagged as a likely security scanner bot.
  - Analytics algorithms ignore `is_bot = true` events when calculating unique opens and click rates.

### 4. Worker Automation (Pixel Injection & Link Wrapping)
- **Pixel Injection**: The Python worker dynamically appends `<img src="API_URL/track/open/base64..." />` before the closing `</body>` tag of outgoing HTML emails.
- **URL Wrapping**: The worker uses regular expressions to find all `<a href="...">` tags and replaces the destination with our proxy `API_URL/track/click?d=base64...`.

### 5. Analytics API
- **`GET /analytics/campaigns/{id}`**: Calculates high-level campaign metrics:
  - Total Sent
  - Unique Opens & Open Rate
  - Unique Clicks & Click Rate (CTR, CTOR)
  - Bounces
- **`GET /analytics/campaigns/{id}/recipients`**: Provides tabular, paginated data showing exactly which subscriber triggered which event.
- **`GET /analytics/sender-health`**: Aggregates data across the entire tenant workspace to provide an account-wide sender reputation score based on daily volume, average open rate, and aggregate bounce rate.

### 6. Frontend Dashboards
- **Campaign Analytics Page (`/campaigns/[id]/analytics`)**: 
  - Summary KPI cards.
  - Recipient interaction table with state filters (All, Opened, Clicked, Bounced).
- **Global Dashboard**:
  - Implementation of the "Sender Health & Deliverability" widget displaying live aggregated tenant data.

## Environment Requirements
- The `.env` file must specify a publicly accessible `API_BASE_URL` (e.g., an ngrok URL during local development, or a real domain in production) so that recipient email clients can successfully hit the tracking endpoints.

## Future Enhancements (Post-MVP)
- **Database Partitioning**: As the `email_events` table grows, it should be partitioned by month or event type to maintain query speed.
- **Honeypot Links**: Injecting hidden `display:none` links to catch sophisticated bots.
- **Apple MPP Separation**: UI toggle to explicitly view or hide "Proxy Opens" from Apple devices to give a truer behavioral open metric.
