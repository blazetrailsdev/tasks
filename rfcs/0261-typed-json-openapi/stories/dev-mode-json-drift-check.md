---
title: "actionpack: opt-in dev middleware logs JSON responses that drift from the OpenAPI schema"
status: draft
updated: 2026-11-28
rfc: "0261-typed-json-openapi"
cluster: openapi
packages: [actionpack]
deps: [openapi-json-schema-converter]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design 6. Validate rendered JSON against `tmp/openapi.json` in development,
to catch `asJson` overrides and hand-built hashes that the static types can't see.

## Acceptance criteria

- [ ] It's off by default, and enabled with a `config.action_controller` flag.
- [ ] A mismatch logs the route, status, and JSON pointer of the first difference.
- [ ] It does nothing in production, even when the flag is set.
