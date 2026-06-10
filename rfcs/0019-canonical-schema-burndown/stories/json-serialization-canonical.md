---
title: "json_serialization_test.rb → canonical models + fixtures"
status: draft
updated: 2026-06-10
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 300
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of the original `serialization-cluster` story (which shipped only
`serialization.test.ts`). Convert `json-serialization.test.ts` →
`json_serialization_test.rb` onto canonical models + `TEST_SCHEMA` + fixtures.

NOTE: the current TS file is built on ~20 synthetic ad-hoc tables
(`post_j1s`, `comment_j2s`, `author_j7s`, …) that have NO Rails counterpart.
A faithful port means rewriting the bodies onto canonical Author/Post/Comment
models, not a mechanical `defineSchema` → `TEST_SCHEMA` swap. Remove
`packages/activerecord/src/json-serialization.test.ts` from
`eslint/require-canonical-schema-exclude.json` when done.

## Acceptance criteria

- [ ] Rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)` lookups.
- [ ] Test bodies match `json_serialization_test.rb` word-for-word; names unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; removed from exclude JSON.
