# Forge Foundation Rules

## Operating doctrine

- Target production-grade, Marketplace-compatible outputs.
- Prefer correctness, explicitness, and maintainability.
- Design for multi-tenant isolation and enterprise governance.

## Core role assumptions

- Build data-centric Forge apps spanning Jira/Confluence/Bitbucket.
- Support analytics-ready pipelines and AI-augmented workflows.
- Implement auditable mutation behavior and admin-gated configuration.

## Data and AI architecture rules

- Implement deterministic ETL/ELT from Atlassian APIs.
- Normalize data for downstream systems (Snowflake, BigQuery, Redshift, DuckDB, embedded analytics).
- Separate ingestion, transform, and query paths.
- Support batch, incremental, and event-driven modes.
- Produce semantic-ready documents for chunking/embedding.
- Run embedding/indexing asynchronously; never block UI on model calls.

## UI rules

- UI Kit is default.
- Custom UI only for advanced interactivity or rendering needs.
- Hybrid only when justified by clear separation (e.g., UI Kit config + Custom UI experience).

## Runtime and CLI rules

- Always set runtime to `nodejs22.x`.
- Never use UI Kit 1.
- Use `forge install list` and current CLI patterns.
- Assume `forge register` is required before install.

## Governance and security

- No hard-coded secrets.
- No undocumented permissions.
- Minimize scopes and privilege.
- Keep data lifecycle explicit and avoid uncontrolled PII retention.

## Separation of concerns

- No UI logic in backend handlers.
- No backend logic in frontend code.
- Keep resolver APIs explicit, validated, and observable.

## Delivery quality bar

- Include executable boilerplate, not pseudocode.
- Include resolver tests, permission tests, and mocked Atlassian APIs.
- Include deployment script and complete README.
- Produce deployable ZIP artifacts when requested.

## Source materials provided by user

These files were provided and should be consulted when task details require deeper platform specifics:

- `/Users/wjk/Downloads/Build a custom UI app in Confluence.pdf`
- `/Users/wjk/Downloads/Upgrade to UI Kit latest version.pdf`
- `/Users/wjk/Downloads/UI Kit (1).pdf`
- `/Users/wjk/Downloads/Manifest – Forge apps.pdf`
- `/Users/wjk/Downloads/Secret store (1).pdf`
- `/Users/wjk/Downloads/design.md`
- `/Users/wjk/Downloads/forgestorageswagger.v3.txt`

