# Jira Enterprise Flow Canvas (Forge-only MVP scaffold)

This application is a Forge-hosted MVP scaffold for enterprise Jira flow analytics with WebGL charting foundations.

## Hard constraints (implemented)

- Forge-only architecture
- No Forge Remote
- No data egress to external services
- Jira API access only in backend resolvers via `api.asUser()`

## Current app surfaces

- `jira:projectPage` (`canvas-ui`): Flow Canvas Custom UI shell with WebGL bar rendering
- `jira:adminPage` (`admin-ui`): UI Kit latest admin settings for field mapping and cache/query limits

## Resolver API contract

- `getBootstrap`
- `queryAggregate`
- `listIssues`
- `exportIssuesCsv`
- `saveView`
- `listViews`
- `deleteView`
- `getPerfSnapshot`
- `getAdminConfig`
- `saveAdminConfig`

## Runtime and permissions

- Runtime: `nodejs22.x`
- Scopes:
  - `read:jira-work`
  - `read:jira-user`
  - `storage:app`

## WebGL charting status

- Implemented:
  - WebGL canvas renderer (`static/canvas-ui/app.js`)
  - GPU bar drawing for Flow buckets
  - Hover hit-testing and tooltip
  - Click-to-drill-down wiring
  - CSV export wiring
- Current mode:
  - Mock bridge mode by default for local static execution
  - Ready to switch to real Forge bridge invoke once frontend bundling is added

## Codex generation pipeline (traceability)

This scaffold was generated iteratively by Codex using the following pipeline:

1. Constraint ingestion and architecture gating
   - Parsed product brief and explicit constraints: `no remote`, `no data egress`.
   - Applied Forge architecture rules:
     - Custom UI for rich rendering (WebGL)
     - UI Kit for admin/config
     - strict resolver/frontend boundary
     - minimum scopes

2. Repository reconnaissance
   - Inspected workspace for existing Forge references and patterns.
   - Reused proven resolver and module conventions from existing workspace samples.

3. Scaffold generation
   - Created standalone app directory: `jira-enterprise-flow-canvas/`.
   - Added core artifacts:
     - `manifest.yml`
     - `package.json`
     - `src/index.js`
     - `src/frontend/admin.jsx`
     - `static/canvas-ui/index.html`
     - `deploy-production.sh`
     - `tests/index.test.js`

4. Resolver/data pipeline implementation
   - Added staged aggregate query path (`queryAggregate`) with:
     - bounded max issue fetch
     - cache keys based on user + JQL + view + config
     - TTL-backed aggregate cache in Forge storage
   - Added saved views, drilldown list endpoint, CSV export, and perf snapshot.
   - Added admin-gated config writes.

5. Testability hardening
   - Extracted pure aggregation logic to `src/lib/aggregates.js`.
   - Added unit tests for aggregation/grouping/hash determinism.
   - Set package ESM mode (`"type": "module"`).

6. WebGL slice implementation
   - Replaced static placeholder UI with active chart shell.
   - Implemented shader program, vertex/color buffers, bar rendering, tooltip hit-testing, and click drilldown flow.
   - Added mock bridge client fallback to keep chart runnable before bundler integration.

7. Verification
   - Executed `npm test` successfully (`3` tests passing).
   - Verified file-level app scaffold integrity and script executability.

## Local development

1. Install dependencies:
   - `npm install`
2. Run tests:
   - `npm test`
3. Deploy to development:
   - `forge deploy`
   - `forge install --site=<your-site>.atlassian.net --product=jira`

## Production deployment

```bash
FORGE_SITE=<your-site>.atlassian.net ./deploy-production.sh
```

## Next implementation slices

- Add frontend bundling for `@forge/bridge` in Custom UI and replace mock invoke path.
- Add Distribution view (scatter/density) in WebGL.
- Add “How computed” and performance/freshness panel in project page UI.
