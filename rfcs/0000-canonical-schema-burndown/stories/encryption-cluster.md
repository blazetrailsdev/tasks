---
title: "encryption/ suite → canonical schema + Rails fixtures"
status: draft
updated: 2026-06-09
rfc: "0000-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 250
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the encryption files (RFC §Rollout phase 4).

Files (remove each from the exclude JSON as it lands):

- `encryption/contexts.test.ts` → `encryption/contexts_test.rb`
- `encryption/encryptable-record.test.ts` → `encryption/encryptable_record_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.

## Notes

- `encryption/contexts.test.ts` was previously body-ported (memory
  `encryption_contexts_fixture_parity_blocked`, EC PR 1/2) but remains on the
  exclude list — likely a near-mechanical schema-ref swap; verify body fidelity.
