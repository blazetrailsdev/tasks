---
title: "trailmap: frontend consumes the generated OpenAPI through openapi-fetch"
status: draft
updated: 2026-11-27
rfc: "0000-typed-json-openapi"
cluster: openapi
packages: []
deps: [openapi-request-bodies-from-permit]
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
- [ ] CI runs `trails-tsc --openapi --check`.
- [ ] Every gap found is filed as a trails story against this RFC.
