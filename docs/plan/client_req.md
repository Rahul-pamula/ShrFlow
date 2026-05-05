# Module 1: Data Uploading - Client Requirements & Research

## Detailed Note
Module 1 serves as the entry point for all contact data within the ShrFlow ecosystem. The primary goal is to provide a seamless, error-tolerant, and accessible interface for importing large datasets while ensuring data integrity. This module must handle various file formats, allow for flexible field mapping, and provide real-time validation feedback to the user.

---

## TASK 01 — Platform Selection

**Chosen Platform:** HubSpot
**Team Name:** Team ShrFlow

### Reasons for Selection:
1. **Industry-Leading CRM Foundation:** HubSpot is built on a robust CRM core, making contact ingestion its most mature and well-tested feature.
2. **Superior Mapping UX:** Their import wizard provides a highly intuitive interface for mapping CSV columns to internal properties, handling complex data types with ease.
3. **Comprehensive Documentation:** HubSpot's developer documentation and API references are industry-standard, offering clear insights into their data validation and object-oriented architecture.

### Platform Analysis:
*   **Relevance:** HubSpot's import tool directly mirrors the requirements for Module 1, specifically handling multi-object imports and custom property mapping.
*   **Accessibility:** HubSpot is committed to WCAG 2.1 compliance. Their import forms use ARIA labels, focus management, and provide clear text summaries of errors.
*   **Market Position:** It is a leader in the SMB and Mid-Market SaaS space, serving users who need powerful tools that remain accessible without deep technical knowledge.
*   **Developer Documentation:** They provide extensive REST API docs, including specialized endpoints for "Imports" which include status tracking and error reporting.
*   **Feature Depth:** It goes beyond simple CSV uploads, offering data cleaning suggestions, duplicate detection, and advanced property type validation.

> [!NOTE]
> **Screenshot 1: HubSpot CRM Overview**
> ![HubSpot CRM Landing](https://www.hubspot.com/hubfs/Import-Tool-UI.png)
> *Caption: The HubSpot CRM interface showing the starting point for data ingestion. It highlights the focus on "Objects" (Contacts, Companies) as the foundation.*

---

## TASK 02 — Platform Deep-Dive: Data Uploading

### Analysis Points:
1. **File Upload Interface:** A multi-step wizard. Users select the import type (File from computer), upload the file (Drag & Drop or Button), and then choose the object type (Contacts).
2. **Supported File Types:** Supports `.csv`, `.xlsx`, and `.xls`. File size limit is up to 512MB for paid tiers, ensuring scalability for large lists.
3. **Header Mapping:** Automatically matches spreadsheet headers to HubSpot properties. Users can manually override or create new properties on the fly.
4. **Custom Field Creation:** Users can create custom properties (text, dropdown, checkbox, date, etc.) directly within the import flow if a matching field doesn't exist.
5. **Validation:** Provides a "Preview" step. If errors exist (e.g., invalid email format), HubSpot generates an error file that users can download to fix and re-upload.
6. **Accessibility:** Forms are keyboard-navigable. Error messages are programmatically linked to inputs using `aria-describedby`.
7. **Online Record Creation:** Users can manually add a contact via a "Create Contact" sidebar form without needing to upload a file.

> [!IMPORTANT]
> **Key Observation:** HubSpot's "Error File" strategy is a best practice. Instead of just failing, it gives the user a pre-formatted file containing only the rows that failed, with an extra column explaining why.

> [!NOTE]
> **Screenshot 2: File Upload Interface**
> ![HubSpot Upload Flow](https://www.hubspot.com/hubfs/File-Upload-Step.png)
> *Caption: The initial file selection screen supporting drag-and-drop for CSV and Excel files.*

> [!NOTE]
> **Screenshot 3: Header Mapping Screen**
> ![HubSpot Mapping UI](https://www.hubspot.com/hubfs/Mapping-Screen.png)
> *Caption: The mapping interface where spreadsheet columns are aligned with CRM properties.*

> [!NOTE]
> **Screenshot 4: Custom Property Creation**
> ![HubSpot Property Builder](https://www.hubspot.com/hubfs/Property-Creation.png)
> *Caption: The modal allowing users to create new data fields (text, dropdown, date) during the import process.*

---

## TASK 03 — Tech Stack Mapping

| Layer | Platform (HubSpot Inferred) | Project Stack (ShrFlow) |
| :--- | :--- | :--- |
| **File Parsing** | Java (Apache POI) / Python | Python (Pandas + Openpyxl) |
| **Frontend** | React + TypeScript + Sass | React + TypeScript + Tailwind CSS |
| **Form Builder UI** | Custom React Components | React + Radix UI / Headless UI |
| **Validation** | Server-side (Java/Dropwizard) | Client: Zod / RHF | Server: Pydantic |
| **Backend** | Java (Dropwizard) / Python | Python (FastAPI / Celery) |
| **Database** | MySQL (Vitess) / Elasticsearch | PostgreSQL (Row-level isolation) |
| **Storage** | AWS S3 | AWS S3 |
| **Auth** | OAuth2 + Custom RBAC | JWT + Clerk / AWS Cognito |

---

## TASK 04 — Gap Analysis

| Required Feature | HubSpot Has It? | Notes / Gap Description |
| :--- | :--- | :--- |
| Upload CSV, XLS, XLSX | Yes | Full support with large file handling. |
| Clean header validation | Yes | Auto-mapping with confidence scores. |
| Custom field creation | Yes | Supports wide range of types including "Calculated" fields. |
| Header mapping UX | Yes | Column-by-column mapping with data preview. |
| Online record creation | Yes | Sidebar quick-add and full form add. |
| Server/Client validation | Yes | Real-time email format check + server-side schema check. |
| Accessible file input | Yes | High-contrast drag-and-drop zones. |
| Auto-populated "Created Date" | Yes | System field `hs_createdate` is auto-set. |

### Summary of Key Gaps:
While HubSpot is comprehensive, its complexity can be overwhelming for simple use cases. ShrFlow will focus on a **"Mapping-First"** approach where the preview is interactive. HubSpot's error handling requires downloading a file; ShrFlow intends to implement **Inline Error Correction** for small datasets to improve UX speed.

---

## TASK 05 — Module Design Plan

### A. Component Breakdown
*   **FileUploadZone:** Reusable drag-and-drop component with progress tracking.
*   **MappingMatrix:** Interactive table for column-to-property mapping.
*   **PropertyCreationModal:** Pop-up to define new fields on the fly.
*   **ImportSummary:** Post-import dashboard showing success/fail counts.
*   **ContactQuickAdd:** Small, reusable form for manual entry.

### B. API Design Sketch
*   `POST /v1/imports/upload`: Receives file, returns temporary `file_id`.
*   `GET /v1/imports/:file_id/preview`: Returns first 5 rows for mapping.
*   `POST /v1/imports/:file_id/map`: Submits mapping configuration.
*   `POST /v1/properties`: Creates a new custom field definition.
*   `GET /v1/imports/:id/status`: Polls status of background processing job.

### C. Accessibility Plan (WCAG 2.1 AA)
1. **Focus Management:** Ensure focus returns to the "Upload" button after a modal closes.
2. **Live Regions:** Use `aria-live="polite"` for upload progress updates.
3. **Semantic HTML:** Use `<fieldset>` and `<legend>` for grouped form elements.
4. **Contrast:** Maintain 4.5:1 ratio for all instruction text.
5. **Screen Reader Testing:** Approach includes manual audits using **VoiceOver (macOS)** and **NVDA (Windows)** to ensure table headers in the mapping UI are correctly announced.
6. **Programmatic Error Linking:** All validation errors will use `aria-errormessage` or `aria-describedby` to link the error text to the specific input field.

### D. Integration Points
*   **Module 2 (Email Creation):** Provides the "Recipient List" selected from uploaded data.
*   **Module 4 (Email Sending):** Consumes the "Validated Email" field from Module 1.
*   **Module 5 (Reporting):** Tracks "Import Source" as a dimension for campaign analytics.

---

## Implementation Tasks

- [ ] Setup S3 bucket for temporary file storage.
- [ ] Implement Pandas-based file parser in FastAPI.
- [ ] Build Drag-and-Drop UI with `react-dropzone`.
- [ ] Create Dynamic Mapping UI (Radix Table + Select).
- [ ] Implement Background Worker (Celery/Redis) for large imports.
- [ ] Conduct Screen Reader audit on mapping form.

---
---

# Module 2: Email Creation - Client Requirements & Research

## Detailed Note
Module 2 is the creative engine of ShrFlow. It must provide a powerful yet accessible environment for users to design high-converting email campaigns. The editor needs to balance the flexibility of a rich-text environment with the structural integrity required for responsive email HTML. Integration with Module 1 is critical for dynamic personalization via merge tokens.

---

## TASK 01 — Platform Selection

**Chosen Platform:** HubSpot
**Team Name:** Team ShrFlow

### Reasons for Selection:
1. **Dynamic Personalization Synergy:** HubSpot’s editor is natively tied to its CRM properties, providing a blueprint for how Module 2 should consume data from Module 1.
2. **Built-in Accessibility Guardrails:** It includes real-time accessibility checking (alt-text reminders, contrast warnings) which is a core requirement for our project.
3. **Advanced AI Integration:** Their "Breeze AI" content assistant sets a high bar for generative text and subject line optimization within the email workflow.

### Platform Analysis:
*   **Relevance:** Directly addresses the need for a WYSIWYG editor that handles templates and dynamic tokens.
*   **Accessibility:** Offers documented WCAG 2.1 compliance features, including automated checks for image alt text and link descriptive text.
*   **Market Position:** Dominates the "All-in-One" Marketing automation space for Mid-Market firms.
*   **Developer Documentation:** Provides clear APIs for managing email templates and rendering content via their design system (Canvas).
*   **Feature Depth:** Includes multi-variant testing, content optimization, and a drag-and-drop module system that goes beyond basic rich text.

> [!NOTE]
> **Screenshot 1: HubSpot Email Editor Interface**
> ![HubSpot Email Editor](https://www.hubspot.com/hubfs/Email-Editor-UI.png)
> *Caption: The HubSpot Drag-and-Drop editor showing the modular blocks on the left and the live canvas in the center.*

---

## TASK 02 — Platform Deep-Dive: Email Creation

### Analysis Points:
4. **Editor Type:** Primarily a **Drag-and-Drop builder** with nested **TinyMCE-powered WYSIWYG** text modules. It offers a "Visual" mode and a "Plain Text" mode.
5. **Formatting Toolbar:** Comprehensive options: Font selection (standard + web safe), size, B/I/U, text/background color, alignment, line spacing, bullet/numbered lists, subscript/superscript, link insertion, and emoji picker.
6. **Personalization Tokens:** Users can insert tokens like `{{ contact.firstname }}`. These are directly mapped to the CRM property database.
7. **AI Features:** "Breeze AI" allows users to highlight text and click "Refine" to shorten, lengthen, or change tone. It also generates subject line suggestions based on body content.
8. **Template System:** Large library of pre-built, goal-oriented templates (e.g., Newsletters, Promotions). Users can save custom layouts as new templates.
9. **HTML Output:** HubSpot uses a proprietary rendering engine to ensure 99% compatibility across Outlook, Gmail, and Apple Mail. It handles mobile responsiveness via automated fluid layouts.
10. **Accessibility in Editor:** The "Check" tool flags missing alt text for images, low color contrast, and broken links before the user can publish.

> [!NOTE]
> **Screenshot 2: Formatting Toolbar**
> ![HubSpot Toolbar](https://www.hubspot.com/hubfs/Email-Toolbar.png)
> *Caption: The rich-text formatting toolbar showing typography, alignment, and link controls.*

> [!NOTE]
> **Screenshot 3: Personalization Token Picker**
> ![HubSpot Tokens](https://www.hubspot.com/hubfs/Token-Picker.png)
> *Caption: The dropdown interface for inserting dynamic CRM properties into the email body.*

> [!NOTE]
> **Screenshot 4: AI Content Assistant**
> ![HubSpot AI Sidepanel](https://www.hubspot.com/hubfs/AI-Assistant.png)
> *Caption: The Breeze AI sidebar offering text refinement and subject line generation.*

> [!NOTE]
> **Screenshot 5: Accessibility Checker**
> ![HubSpot Accessibility tool](https://www.hubspot.com/hubfs/Accessibility-Check.png)
> *Caption: The real-time audit panel highlighting WCAG violations like missing alt-text.*

---

## TASK 03 — Tech Stack Mapping

| Layer | Platform (HubSpot Inferred) | Project Stack (ShrFlow) |
| :--- | :--- | :--- |
| **Frontend** | React + TypeScript | React + TypeScript + Tailwind CSS |
| **Editor Library** | TinyMCE (Customized) | Tiptap (ProseMirror based) |
| **Template Engine** | Proprietary Canvas Rendering | MJML (via Node.js/Python) |
| **AI Integration** | Breeze AI (OpenAI/Internal) | OpenAI API (GPT-4o) |
| **Token Engine** | Java-based String Template | Custom Regex/Handlebars Parser |
| **Backend** | Java (Dropwizard) | Python (FastAPI) |
| **Storage** | Amazon S3 | Amazon S3 |
| **Auth** | JWT / Session | JWT + RBAC |

---

## TASK 04 — Gap Analysis

| Required Feature | HubSpot Has It? | Notes / Gap Description |
| :--- | :--- | :--- |
| Rich text editor | Yes | Full TinyMCE integration. |
| Font color/spacing | Yes | Extensive typography controls. |
| Lists (Bulleted/Num) | Yes | Standard UI support. |
| Subscript/Superscript | Yes | Available in the "More" toolbar menu. |
| Link insertion | Yes | Includes "Open in new window" and "No-follow" options. |
| Emoji picker | Yes | Native OS-style picker. |
| Image upload w/ Alt text | Yes | Required field in the image module sidebar. |
| File attachment | Yes | Via the "Document" tool integration. |
| Personalization tokens | Yes | Directly linked to CRM (Module 1). |
| AI content generation | Yes | High-quality text and image generation. |
| WCAG 2.1 AA Editor | Yes | Built-in "Accessibility Check" sidebar. |
| Responsive HTML output | Yes | Automated fluid grid rendering. |

### Summary of Key Gaps:
HubSpot’s editor is heavily modular, which can make it difficult to do "pure" free-form HTML editing without using their Developer File Manager. ShrFlow will aim to bridge this by using **Tiptap**, allowing for a more fluid text-first experience that still outputs structured, responsive **MJML-based HTML**.

---

## TASK 05 — Module Design Plan

### A. Component Breakdown
*   **EmailEditorCanvas:** The primary Tiptap-based editing surface.
*   **FormattingToolbar:** Floating/Fixed toolbar with all typography and alignment controls.
*   **TokenDropdown:** A searchable list of fields (mapped from Module 1) that inserts `{{ field_name }}`.
*   **AIContentSidebar:** A dedicated panel for "Generate from Prompt" and "Improve Text" features.
*   **MJMLRenderer:** A backend-linked utility to convert JSON editor state to mobile-responsive HTML.
*   **AccessibilityAuditPanel:** Real-time list of WCAG violations in the current draft.

### B. API Design Sketch
*   `GET /v1/templates`: List available system and user templates.
*   `POST /v1/ai/generate-copy`: Sends prompt to LLM, returns suggested content.
*   `POST /v1/ai/subject-lines`: Returns 5 suggested subject lines based on body.
*   `POST /v1/emails/preview`: Returns a rendered HTML string for browser display.
*   `GET /v1/fields/tokens`: Fetches available property names from Module 1 for the token picker.

### C. Accessibility Plan (WCAG 2.1 AA)
11. **ARIA Labels:** All toolbar buttons must have descriptive `aria-label` values.
12. **Keyboard Traps:** Ensure the emoji picker and token dropdown can be escaped with `Esc`.
13. **Screen Reader Feedback:** Use `aria-live` to announce AI generation status.
14. **Focus Management:** Tab order must flow logically from toolbar to canvas to sidebar.
15. **Screen Reader Testing:** Use **NVDA** and **VoiceOver** to verify that the virtual cursor correctly navigates the Tiptap canvas and announces formatting states (e.g., "Bold").
16. **Programmatic Error Linking:** Ensure the `AccessibilityAuditPanel` links each error to the specific node in the editor for quick navigation.

### D. Integration Points
*   **Module 1 (Data Uploading):** Source for all personalization tokens (First Name, Custom Fields).
*   **Module 3 (Email Testing):** Receives the rendered HTML for multi-client previewing.
*   **Module 4 (Email Sending):** Receives the final HTML and subject line for delivery.
*   **Module 5 (Reporting):** Receives template IDs to track performance by design style.

---

## Implementation Tasks

- [ ] Initialize Tiptap with `StarterKit` and custom `Token` extension.
- [ ] Implement MJML conversion service in the backend.
- [ ] Integrate OpenAI GPT-4o for the `AIContentSidebar`.
- [ ] Create a "Merge Tag" node for Tiptap to prevent users from accidentally deleting partial tokens.
- [ ] Build a "Responsive Preview" toggle (Desktop/Mobile).
- [ ] Implement an "Accessibility Check" function that scans the DOM for missing alt attributes.
