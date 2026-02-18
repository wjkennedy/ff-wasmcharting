# Jira Enterprise Flow Canvas (Forge-only MVP scaffold)

This project is a Forge-only baseline for the Jira Enterprise Flow Canvas brief with strict no-egress design:

- No Forge Remote module
- No outbound data egress to external services
- Jira data access only via Forge resolvers and `api.asUser()`

## Modules

- `jira:projectPage` (Custom UI): Flow Canvas entry point
- `jira:adminPage` (UI Kit latest): field mapping and performance/cache config

## Resolver contract

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

## Runtime and scopes

- Runtime: `nodejs22.x`
- Scopes:
  - `read:jira-work`
  - `read:jira-user`
  - `storage:app`

## Local development

1. Install dependencies:
   - `npm install`
2. Run tests:
   - `npm test`
3. Deploy to development:
   - `forge deploy`
   - `forge install --site=<your-site>.atlassian.net --product=jira`

## Production deployment

Set target site and run:

```bash
FORGE_SITE=<your-site>.atlassian.net ./deploy-production.sh
```

## Notes for next implementation slice

- Replace `static/canvas-ui/index.html` with bundled WebGL/WASM client app.
- Keep Jira REST calls in resolvers; client should only call Forge invoke APIs.
- If you need "export to Jira filter", add a write scope in manifest and gate behind admin feature flag.
