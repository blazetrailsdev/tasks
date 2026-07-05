---
title: "Convert column-alias raw INSERT to topics fixtures and flip to transactional"
status: claimed
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 0
pr: null
claim: "2026-07-05T23:34:42Z"
assignee: "convert-column-alias-raw-insert-to-topics-fixtures"
blocked-by: null
closed-reason: null
---

## Context

`column-alias.test.ts` (TestColumnAlias) is the one top-level candidate from
the exact-equiv burndown that stays on `fixtures({}, { useTransactionalTests:
false })` solely because its `beforeAll` does a raw non-fixture write —
`Base.connection.executeMutation("INSERT INTO topics (title) VALUES ('a')")`
(`packages/activerecord/src/column-alias.test.ts:7-9`) — which commits outside
the per-test transaction and leaks a `topics` row into the shared worker DB.
Rails' `column_alias_test.rb` runs transactionally (no `use_transactional_tests`
override) and gets its row from the `topics` fixture set.

## Acceptance criteria

- Replace the raw `INSERT INTO topics` in `beforeAll` with a canonical
  `fixtures(["topics"])` seed (mirror Rails' fixture-backed row), then flip the
  suite to transactional `fixtures({})`.
- No test renames; test:compare delta >= 0; PG/MySQL lanes green.
