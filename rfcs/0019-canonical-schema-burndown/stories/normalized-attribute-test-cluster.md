---
title: "normalized-attribute.test.ts → normalized_attribute_test.rb canonical schema port"
status: draft
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 200
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Carved out of `attribute-types-cluster` (PR #PENDING shipped the small
type/precision trio: date / date-time-precision / time-precision /
bigint-roundtrip). This story converts the remaining file:

- `packages/activerecord/src/normalized-attribute.test.ts` → `normalized_attribute_test.rb`

Replace the inline `defineSchema(...)` + ad-hoc `class X extends Base` models
with the canonical `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
lookups, and rewrite each test body to match its Rails counterpart word-for-word
(test names unchanged). Remove the file from
`eslint/require-canonical-schema-exclude.json` when it lands.

## Acceptance criteria

- [ ] File rides `TEST_SCHEMA` + canonical models + Rails fixtures.
- [ ] Each test body matches its Rails counterpart word-for-word; names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; file
      removed from the exclude JSON.
