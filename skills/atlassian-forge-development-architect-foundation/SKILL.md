---
name: atlassian-forge-development-architect-foundation
description: Foundation doctrine for designing and implementing production-grade Atlassian Forge apps with a data and AI focus. Use when building or reviewing Forge architecture, manifests, UI decisions (UI Kit vs Custom UI), resolver boundaries, storage models, permissions/scopes, testing, deployment packaging, and Marketplace readiness for Jira/Confluence/Bitbucket apps.
---

# Atlassian Forge Development Architect Foundation

Build Forge apps for correctness, maintainability, and deployability. Optimize for enterprise and Marketplace readiness over prototype speed.

## Use This Workflow

1. Classify the primary interaction model.
- Choose one: UI-driven, event-driven, API-driven, job-driven.

2. Choose the product surface.
- Jira: issue view, project page, global page, admin page.
- Confluence: macro, space page, global page.

3. Choose UI technology.
- Default to UI Kit (latest).
- Choose Custom UI only for advanced rendering, complex client logic, or heavy third-party UI libraries.
- Use hybrid only when justified: UI Kit for admin/config, Custom UI for rich experience.

4. Choose identity model.
- `asUser` when behavior must mirror user permissions.
- `asApp` for background/admin or cross-scope operations.

5. Choose data model.
- App storage, entity properties, or external system.
- Separate ingestion, transformation, and query concerns.

6. Validate against mandatory constraints before coding.
- Runtime, scopes, async workload, test coverage, packaging completeness.

## Mandatory Forge Constraints

- Set runtime to the latest supported NodeJS version in every manifest:

```yaml
app:
  runtime:
    name: nodejs22.x
```

- Do not use UI Kit 1.
- Use current Forge CLI patterns (`forge install list`, `forge register` before install).
- Keep Atlassian product API calls in backend resolvers; never call Atlassian APIs directly from Custom UI frontend.
- Avoid deprecated modules, APIs, or components.

## Architecture Rules

- Keep backend/frontend boundaries strict.
- Backend resolvers handle product API, auth context, validation, retries, pagination, rate limiting, and mutation.
- UI handles rendering, interaction state, and resolver calls only.

- For data-heavy workloads:
- Use incremental/event-driven ingestion over full recrawls.
- Use queued or job-style processing for expensive embedding/indexing work.
- Never block UI on model/embedding calls.

- For AI/RAG workloads:
- Create semantic-ready documents from Jira/Confluence data.
- Apply chunking + metadata enrichment.
- Keep LLM orchestration separate from rendering code.

## Governance, Security, and Cost Discipline

- Declare minimum scopes only; start read-only then add write scopes when required.
- Add explicit RBAC for admin-only config/mutation paths.
- Avoid uncontrolled PII storage; document retention and data lifecycle.
- Cache aggressively where safe.
- Keep invocation cost bounded; avoid repeated full-instance scans.
- Do not hard-code secrets.

## Delivery Standard for Generated Apps

Generate this minimum project layout unless the user asks otherwise:

```text
forge-app
|-- src/
|   `-- index.js
|-- static/                  # only for Custom UI
|-- manifest.yml
|-- package.json
|-- deploy-production.sh
|-- README.md
`-- tests/
```

Ship executable assets only; no placeholders or pseudocode.

## Testing Requirements

Always include:

- Resolver unit tests
- Permission boundary tests
- Mocked Atlassian API calls
- Local test run instructions

## Packaging Requirements

When asked for deliverables, produce ZIP-ready output that:

- Installs without modification
- Includes deployment script
- Uses validated manifest and scopes
- Includes complete README

## Review Checklist (Run Before Final Output)

- Runtime is `nodejs22.x`
- UI choice is justified (UI Kit default)
- Resolver/frontend boundaries are clean
- Permissions are minimal and documented
- Storage model fits tenant isolation and scale
- Async/job handling exists for heavy or AI steps
- Tests cover resolver logic and permission boundaries
- Packaging/deploy steps are complete

## References

Load only what is needed for the task:

- Architecture flow and module selection: `references/forge-design-decision-tree.md`
- Forge hosted storage API details: `references/forge-storage-openapi-v3.json.txt`
- Foundation constraints and doctrine summary: `references/forge-foundation-rules.md`

