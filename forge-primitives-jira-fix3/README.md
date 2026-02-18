# Forge Primitives Demo (Jira, UI Kit latest) — Fresh

Features
- Sidebar (Search / Extension Points / About)
- JQL search + results (DynamicTable)
- Saved JQL presets (per detected project)
- CSV export (feature flag)
- Admin page: RBAC + feature flags + Secret Store + app audit
- Optional read-only Jira audit count (requires manage:jira-configuration scope)

## Module coverage
This app includes minimal reference implementations for every Jira module listed in the in-app catalog.

Reference implementation entrypoints:
- Global page: `src/frontend/index.jsx`
- Admin page: `src/frontend/admin.jsx`
- Shared module page: `src/frontend/module.jsx`
- Command palette modal: `src/frontend/commandModal.jsx`
- Dashboard gadget: `src/frontend/dashboardGadgetView.jsx`, `src/frontend/dashboardGadgetEdit.jsx`
- Background scripts: `src/frontend/dashboardBackground.jsx`, `src/frontend/issueBackground.jsx`
- Custom field: `src/frontend/customFieldView.jsx`, `src/frontend/customFieldEdit.jsx`
- UI modifications: `static/ui-modifications/index.html`
- JQL function + workflow post function: `index.js`

## Quickstart
```bash
npm install -g @forge/cli@latest
forge register
forge deploy
forge install --site=<your-site>.atlassian.net --product=jira
# then open Apps → Forge Primitives Demo
```

Notes
- Uses UI Kit latest (`@forge/react`) with native rendering.
- The resolver lives at project root: `index.js`; manifest handler is `index.handler`.
- No external `fetch` or static resources required.


## JQL Editor (Custom UI)
This project bundles Atlassian's JQL Editor Custom UI example under `static/jql-editor` and exposes it as a **Jira Project Page** module.

**First-time build (required):**
```bash
cd static/jql-editor
npm ci
npm run build
cd ../../
forge deploy
```
After the build, open any Jira project → left nav → **JQL Editor (Custom UI)**.
