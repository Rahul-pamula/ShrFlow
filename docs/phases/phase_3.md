# Phase 3 — Template Engine & AI Content Creation
## The Theoretical Architecture & "The Why" Behind Every Decision

> **Who is this for?** Anyone new to this project. This document explains what Phase 3 is, the reasoning behind every task we built, and what would break down without it.

---

## What is Phase 3? (Start Here)

Phase 1 built the identity system. Phase 2 built the audience — the list of people to send to. Phase 3 answers the most fundamental question of an email platform: **what do we actually send?**

**Phase 3 is the Template Engine — the message composition layer that turns design intent into pixel-perfect email HTML.**

Email is one of the most hostile rendering environments in technology. The same HTML that looks perfect in a modern browser will render as broken garbage in Outlook 2016 (which runs on a 20-year-old Microsoft Word rendering engine), look clipped in Gmail (which truncates emails over 102KB), and display incorrectly on small Android screens. Unlike web browsers, email clients are not standardized. There is no Chrome DevTools for email. Every major client (Gmail, Outlook, Apple Mail, Yahoo, Samsung Mail) renders HTML differently, ignores different CSS properties, and handles line spacing differently.

Without Phase 3, a user would have to write raw, deeply defensive email HTML by hand — a skill that takes months to master and still produces inconsistent results. Phase 3 solves this by introducing MJML: a markup language that compiles to email-safe HTML automatically, handling all client-specific quirks invisibly.

Phase 3 also introduces the platform's AI generation layer — turning a natural language prompt like "write a friendly re-engagement email for an e-commerce store" into a complete, branded email draft in seconds.

---

## Section 1 — Template Storage & Core CRUD

### Template CRUD (Create, Read, Update, Delete)

Without a template management system, every campaign would require writing its email HTML from scratch — a 2-hour task that becomes an impossible bottleneck for any marketing team running more than a handful of campaigns per week. Templates are the reusable asset library of the platform: save a campaign email as a template, reuse it next month with updated copy, fork it into a newsletter variant. The backend routes (`POST /templates`, `GET /templates`, `PUT /templates/{id}`, `DELETE /templates/{id}`) give the frontend full lifecycle control over the template inventory, with all queries scoped by `tenant_id` so Company A's templates are invisible to Company B.

### Category System

When a template library grows beyond 20 templates, finding the right one requires organization. Templates belong to categories (`newsletter`, `promotional`, `transactional`, `event`, `re-engagement`) that are stored as a `category` field and used to filter the templates list. Without categorization, a marketing team with 200 templates would have to scroll through an unsorted grid searching for the right starting point, slowing down every campaign creation workflow.

### Persist Compiled HTML from the Active Block Editor

Every time a user saves a template, the current structured design (`design_json`) should be compiled into email-safe HTML and stored alongside the design data. This is critical because campaigns don't use `design_json` at send time — they use the pre-compiled `compiled_html`. If `compiled_html` is stale or still contains the placeholder `<p>Loading…</p>` from initial creation, every campaign using that template would send a completely blank email to real subscribers. The save path must compile-and-persist atomically every time the user clicks Save.

### Preset Gallery and Preset-Driven Template Creation

Starting from a blank white canvas is cognitively overwhelming. A user staring at an empty email editor doesn't know where to put the logo, how wide the content column should be, or how to structure a footer. Presets are fully designed starter templates — a "Newsletter Starter" with a header banner, two-column content, and footer — that let a user begin editing from a professional layout in one click. Without presets, adoption of the template editor is dramatically lower because the barrier to getting "something that looks good" is too high for non-designers.

### Template Versioning (Save History)

Every time a template is edited and saved, we create an immutable snapshot of the previous version. This means if a user accidentally overwrites a carefully crafted email design with bad edits, they can restore the previous version from the version history panel. Without versioning, a single bad save permanently destroys hours of design work with no recovery mechanism — a mistake that happens regularly in fast-paced marketing teams making last-minute changes before a campaign send.

---

## Section 2 — The Compile Pipeline (MJML)

### Server-Side Compile Preview (`design_json` → MJML → HTML)

The structured block editor stores template content as a JSON object (`design_json`) that describes the layout in abstract terms ("Row with 2 columns, left column has a Text block saying 'Hello', right column has an Image block"). This JSON must be compiled into real email HTML before it can be previewed or sent. We do this on the **server side** (not in the browser) through a Python rendering pipeline that converts `design_json` into MJML markup, then invokes the MJML CLI to compile it into battle-tested, email-client-safe HTML. Doing this server-side means the compiled output is consistent regardless of the user's browser, and the MJML compiler handles all the cross-client compatibility quirks automatically. Without server-side compilation, we would have to maintain our own JavaScript email rendering engine in the browser — an enormous ongoing maintenance burden.

### MJML Processing Pipeline

MJML is a specialized markup language designed specifically for email. A developer writes simple, semantic MJML tags like `<mj-text>Hello</mj-text>` and the MJML compiler transforms them into deeply nested HTML tables, inline styles, and Outlook-specific conditional comments — the exact structure that email clients require for consistent rendering. Without MJML, writing email HTML that renders correctly across 50+ email clients requires expert knowledge of deeply outdated HTML conventions (tables within tables, inline styles for every element, repeated conditional comments for Outlook VML — techniques that haven't been used in normal web development since 2005).

### Plain-Text Auto-Generator (Sync from HTML for Spam Filters)

Every email sent must include both an HTML version and a plain-text version. This is both a deliverability requirement and a spam filter requirement. Spam filters like SpamAssassin check that the plain-text version is a reasonable representation of the HTML version — if the HTML says "Buy Now for 50% off!" but the plain text is empty, spam filters treat the discrepancy as a deception signal and lower the email's deliverability score. The auto-generator strips HTML tags from the compiled template and produces a readable plain-text alternative automatically, so users never have to maintain two versions of their email copy manually.

### Email Spam Heuristic Checker (SpamAssassin-style)

Before a campaign is sent to 100,000 subscribers, the platform should warn the user if their email is likely to be classified as spam by receiving mail servers. A heuristic checker scores the template based on known spam-triggering patterns: ALL-CAPS subject lines, the word "FREE" in the subject, no unsubscribe link, email-to-text ratio too skewed toward images, HTML body exceeding Gmail's 102KB clip limit. Without this pre-send check, users unwittingly send campaigns that land in spam folders for 40% of recipients and don't understand why their open rates are 2% instead of 20%.

### Template Accessibility Scanner (WCAG 2.1 Checks)

Emails must be accessible to users with visual impairments who use screen readers. The accessibility scanner checks that every image has an `alt` attribute (so screen readers can describe the image), that color contrast ratios between text and background meet WCAG 2.1 AA standards (so people with low vision can read the content), and that semantic heading hierarchy is valid. Without accessibility scanning, the platform produces inaccessible emails by default, which creates legal liability for enterprise customers operating under ADA or EN 301 549 compliance requirements.

---

## Section 3 — The Block Editor UI

### Structured Block Editor (Rows → Columns → Blocks)

Instead of writing raw HTML or using a complex general-purpose website builder, the block editor uses an email-appropriate compositional model: a template is composed of Rows (horizontal lanes), each Row contains Columns (vertical divisions), and each Column contains Blocks (the actual content: text, image, button, divider, social links). This hierarchy maps directly to how email clients process email structure — which is table-based, not CSS-flexbox-based. A user can drag blocks between columns, reorder rows, and duplicate sections without writing a single line of HTML. Without a structured editor, the only way to create email templates is hand-coding — eliminating 95% of potential users who are marketers, not engineers.

### Supported Block Types

The block palette includes: `text` (rich formatted copy), `image` (responsive images with alt text), `button` (CTA with configurable URL and styling), `divider` (horizontal rules for section separation), `spacer` (configurable whitespace for breathing room), `social` (pre-built social media icon links), `hero` (large banner image with overlay text), and `footer` (standardized unsubscribe + company address block). Without a rich block palette, users are forced to approximate all of these patterns using raw HTML knowledge they don't have.

### Desktop/Mobile Preview Mode (375px Viewport Toggle)

A template that looks perfect on a 1400px desktop monitor may be completely unusable on a 375px iPhone screen — text too small to read, two-column layouts that overflow horizontally, images that don't scale. The preview mode toggle instantly switches the editor canvas to simulate a 375px mobile viewport so users can catch layout failures before the email reaches subscribers. Without mobile preview, every template must be manually tested on a real mobile device after sending a test email — a slow, iterative cycle that adds hours to the design workflow.

### Inbox Preview Simulation (Gmail, Outlook, Apple Mail Rendering)

Beyond basic mobile vs. desktop layout, different email clients have specific rendering bugs. We simulate the visual anomalies of the major inbox clients — Gmail's image-blocking default, Outlook's notorious line-height handling, Apple Mail's dark mode color inversions. Without inbox simulation, users discover rendering problems only after sending the campaign to real subscribers, when it is already too late to fix.

### Duplicate Template Button

Duplication is among the highest-frequency actions in any template library. A user builds a perfect "Monthly Newsletter" template and wants to create a "Weekly Newsletter" variant with the same structure but different accent colors. Without a duplicate action, they must create a new template from scratch, manually recreating every row, column, and block configuration — wasting 30+ minutes on mechanical work that should take 5 seconds.

### Version History Panel (See and Restore Older Versions)

Marketing teams iterate rapidly and often destructively. A user edits a template for a new campaign, makes major changes, then realizes the client preferred the previous version. The version history panel shows all saved snapshots of the template with timestamps, lets the user preview any historical version, and restores it with one click. Without version history, every save is a one-way door — the previous state is permanently replaced with no recovery path.

### Dynamic Placeholder Guide (Show List of `{{merge_tags}}`)

Merge tags like `{{first_name}}`, `{{company_name}}`, and `{{unsubscribe_link}}` make emails feel personal — the email that says "Hi Sarah" instead of "Hi there" gets significantly higher open rates and engagement. But users can't use merge tags they don't know exist. The placeholder guide surfaces all available merge tags as a clickable reference panel directly inside the editor, with one-click insertion into the active text block. Without this guide, users either skip personalization entirely or typo their merge tags (`{{firstname}}` instead of `{{first_name}}`), causing emails that display raw tag text to subscribers.

### Send Test Email Button (Enter Email → Receive Real Email)

The only way to truly verify how a template renders is to send it to a real email client. The "Send Test" button lets users enter their own email address and receive the compiled template as a real email — in their actual Gmail or Outlook inbox — so they can check how images load, how fonts render, whether the unsubscribe link works, and how the plain-text fallback reads. Without a test-send mechanism, the only way to test is to create a real campaign, select test contacts, and send — a cumbersome multi-step process that interrupts the design workflow.

### Categories Filter Tabs on Template List

Once a template library grows to 100+ designs, a flat scrollable grid becomes unusable. Category filter tabs (`All`, `Newsletter`, `Promotional`, `Transactional`) allow users to narrow the list to the relevant category in one click. Without filter tabs, finding a specific template type requires scrolling through potentially hundreds of cards or relying on a text search where the user must remember the exact name.

### Public View-Online Link (Render Template in Browser Without Login)

Every marketing email should include a "View in browser" link at the top for subscribers whose email clients block images or render HTML poorly. Clicking this link opens a live, publicly accessible HTML render of the exact email in the user's browser — no login required. Without a public view-online endpoint, subscribers with broken email rendering have no fallback, and the platform's emails are permanently inaccessible to them.

---

## Section 4 — AI Content Generation

### AI-Assisted Content Generation API (Backend Proxy to LLM)

The backend proxy routes AI generation requests to a Large Language Model (LLM) endpoint (such as GPT-4 or Gemini) while keeping the API key server-side and adding tenant-level rate limiting and audit logging. This proxy pattern is critical for two reasons: it prevents users from directly calling the LLM API (which would expose our API key if we put it in the frontend), and it allows us to add future business logic like token usage tracking, custom prompt injection for brand voice consistency, and content moderation without changing the frontend.

### AI Copywriting Assistant UI (Magic-Wand Buttons Inline in Editor)

The AI writing assistant surfaces directly inside the block editor as contextual controls on text blocks — a "magic wand" icon that opens a prompt panel. The user can ask the AI to "rewrite this paragraph more formally," "generate three alternative subject line options," or "make this more conversational." The AI returns suggestions that the user can accept, reject, or edit. Without the inline AI integration, users would need to tab between the email editor and ChatGPT constantly, breaking their creative flow and slowing down copywriting work dramatically.

### Tone and Rewrite Adjustments

Different emails require different emotional registers — a re-engagement campaign should feel warm and human, a product launch announcement should feel exciting and urgent, a transactional receipt should feel clinical and trustworthy. The tone adjustment system lets users select from preset tone targets (`Friendly`, `Professional`, `Urgent`, `Casual`) and sends the current copy to the LLM with a tone-specific system prompt that rewrites the text accordingly. Without tone controls, every AI generation produces the same neutral corporate voice that fails to match the authentic voice of the brand.
