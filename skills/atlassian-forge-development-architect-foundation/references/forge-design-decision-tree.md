Forge app design decision tree
0) Start: what is the user trying to do?

A. Show something inside Jira or Confluence
Go to 1

B. React to an event (issue created, page updated, schedule, web trigger)
Go to 6

C. Provide an external API or integration endpoint
Go to 7

D. Run a long job (imports, exports, heavy analysis)
Go to 8

1) Where does it live in the product UI?

Jira

Issue view context (single issue)

Project context (project pages)

Global context (global page)

Admin context (admin pages, configuration)

Confluence

Page context (macro)

Space context

Global context (global page)

Admin context

Decision:

If the user’s workflow is centered on a single issue or page: choose an issue panel / issue glance / macro

If it spans many issues/pages in a project/space: choose a project page / space page

If it’s a tool that applies broadly: choose a global page

If it configures behavior: choose an admin page + configuration UI

Go to 2

2) Is the UI mostly “forms and tables” or “custom experience”?

A. Forms, tables, simple dashboards, wizards
Prefer UI Kit. Go to 3

B. Custom UI (full React control, advanced visuals, WebGL/WebGPU/WASM, rich components)
Choose Custom UI. Go to 5

Rule of thumb:

If you can express your interface as “Atlassian-style components with state and callbacks,” UI Kit is simpler.

If you need pixel-perfect layout, complex client logic, heavy rendering, or third-party libraries, Custom UI.

3) UI Kit: what interaction pattern?

A. Single-screen view (read-only or lightly interactive)
Use UI Kit view components (Text, Heading, Stack, Inline, Box, SectionMessage).
Handlers: a single resolver function that loads data.

B. Wizard or multi-step flow
Use UI Kit with conditional rendering and local state.
Handlers: resolver routes for each step, plus submit handlers.

C. Data table / list with filters
Use UI Kit table/list components plus inputs for filtering.
Handlers: query handler (search), paging handler, optional export handler.

Go to 4

4) UI Kit: what data is being shown or modified?

A. Jira/Confluence data via REST (issues, projects, pages, users)
Handlers:

“read” resolver that calls product REST APIs

“write” action handler(s) for create/update transitions, comments, properties, etc.

UI Kit primitives commonly needed:

Inputs: TextField, TextArea, Select, Checkbox, RadioGroup, DatePicker (as applicable)

Actions: Button, ButtonGroup

Feedback: SectionMessage, InlineMessage

Layout: Stack, Inline, Box

Structure: Tabs, Accordion (when appropriate)

B. Your app’s own data (configuration, cached results, user preferences)
Decision: where to store?

Per-user preference: user-scoped storage

Per-site/installation config: app-scoped storage

Per-issue/page metadata: entity properties

Handlers:

read config handler

write config handler

optional migration/seed handler (on install or admin action)

C. Both product data and app data
You will usually need:

a “hydrate” resolver (load product context + app config)

validation handler(s)

save handler(s)

Go to 9 (Security and scopes) and 10 (Packaging)

5) Custom UI: what is driving the decision?

A. Needs advanced rendering (charts, canvas, WASM, 3D, large grids)
Use Custom UI with a frontend bundle.
Handlers: a resolver API surface that returns JSON to the frontend.

B. Needs third-party React components or heavy client logic
Same as above.

C. Needs UI Kit only as a small wrapper
Sometimes do:

UI Kit module to launch or embed

Custom UI inside the main view

Handlers you will almost always need:

Resolver endpoints: getContext, getData, mutateSomething

Authenticated product API calls from backend (preferred) to avoid leaking credentials

Go to 9 and 10

6) Event-driven apps (no primary UI, or UI is secondary)

A. Respond to Jira/Confluence events
Examples: issue created, transitioned, comment added, page updated.

Handlers:

event function handler that receives payload

optional “enrichment” call to fetch extra context

optional “side effect” calls (comment, label, property set, notification)

Optional UI:

an admin page to configure behavior

a project/space page to show logs or status

Go to 9 and 11 (Observability)

7) External integration endpoint

A. Needs to receive inbound calls (webhooks from other systems)

Use a web trigger or dedicated endpoint pattern.
Handlers:

request validation (shared secret, signature, allowlist)

transform payload

product API mutation

B. Needs to expose data outward

Provide an endpoint that reads from product + app storage and returns sanitized output.

Almost always add:

admin configuration for secrets and routing

audit log view (project/global page)

Go to 9 and 11

8) Long-running or heavy workloads

If it might exceed normal request limits or involves batching:

Break into jobs

Store job state

Provide progress UI

Handlers:

start job handler

process batch handler (repeatable)

status handler

cancel handler

UI:

status panel or global page for monitoring

admin controls

Go to 11 and 10

9) Security and permissions decision points
9.1 What identity model is required?

Act as the user

Needed when permissions should mirror the user’s access

Backend calls should respect the user’s entitlements

Act as the app

Needed for admin-level operations, background jobs, or cross-project tasks

Must be carefully scoped and often gated by admin configuration

9.2 What scopes are required?

Decision:

Read-only vs read-write

Jira vs Confluence scope families

Minimal required scopes only

Practical rule:

Start with read scopes, add write scopes only when the feature cannot work without them.

9.3 Where can data be stored safely?

App storage for configuration and cached outputs

Entity properties for issue/page-bound metadata

Avoid storing secrets in places visible to normal users

For secrets: use app-managed secure storage patterns and admin-only configuration UI

10) App structure choices
10.1 Single module vs multi-module

Choose multi-module when:

You need both an end-user view and an admin configuration surface

You want an operational dashboard plus contextual panels

You have distinct workflows (for example issue panel + project page)

10.2 UI Kit only vs Custom UI only vs Hybrid

UI Kit only: fastest for “Atlassian-native” UX and simple interactions

Custom UI only: best for complex UI and advanced rendering

Hybrid: UI Kit for admin/config and entry points, Custom UI for the main experience

10.3 Resolver surface design

Define your backend as a small internal API:

getContext()

getConfig()

setConfig(payload)

queryData(filters)

applyAction(actionPayload)

getStatus(jobId)

This keeps the frontend simple and keeps product API calls centralized.

11) Operational needs (you will regret skipping this)

Decision:

Do you need an audit trail? If you mutate Jira/Confluence, usually yes.

Do you need rate limiting or retries? If you integrate with external systems, yes.

Do you need idempotency? If you process events or inbound webhooks, yes.

Handlers:

log write helper

replay-safe event handler

dedupe key storage (event id or hash)

UI:

admin log viewer

“last run” status component
