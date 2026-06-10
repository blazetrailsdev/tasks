---
title: "secure-password / token cluster → canonical schema + Rails fixtures"
status: ready
updated: 2026-06-09
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 250
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the secure-password / token files (RFC §Rollout phase 1). Small,
self-contained, clean Rails counterparts.

Files (remove each from the exclude JSON as it lands):

- `secure-password.test.ts` → `secure_password_test.rb`
- `secure-token.test.ts` → `secure_token_test.rb`
- `signed-id.test.ts` → `signed_id_test.rb`
- `token-for.test.ts` → `token_for_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.
