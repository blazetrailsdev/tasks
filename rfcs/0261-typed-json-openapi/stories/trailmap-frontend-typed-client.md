---
title: "trailmap: frontend consumes the generated OpenAPI through openapi-fetch"
status: draft
updated: 2026-11-27
rfc: "0261-typed-json-openapi"
cluster: openapi
packages: [actionpack, trails-tsc]
deps: [openapi-request-bodies-from-permit, dev-mode-json-drift-check, openapi-check-mode]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

**Lands in:** trailmap.

## Context

RFC 0136 makes trailmap the proving ground. Generate trailmap's
`openapi.json` in its build, run `openapi-typescript` for the Vite frontend,
and replace its hand-written response types with an `openapi-fetch` client.

## Acceptance criteria

- [ ] The frontend compiles against the generated client, with hand-written API types removed.
- [ ] The drift check is enabled in trailmap's test and dev runs, with zero mismatches.
- [ ] CI runs `trails-tsc --openapi --check`.
- [ ] Every gap found is filed as a trails story against this RFC.
