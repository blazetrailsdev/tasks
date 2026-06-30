---
title: "converge-adapter-one-schema"
status: claimed
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-30T17:32:27Z"
assignee: "converge-adapter-one-schema"
blocked-by: null
---

## Context

Split from `converge-migrator-stmtcache-adapter-one-schema` (RFC 0048): that
story bundled three files; the statement-cache file shipped on its own (faithful
port of `statement_cache_test.rb`). This story carries the remaining adapter
file under the same binding **Convergence contract** in the RFC 0048 README
(faithful word-for-word Rails port, not a rename).

`packages/activerecord/src/adapter.test.ts` (~1512 LOC of bespoke trails tests)
must be rewritten to mirror `vendor/rails/activerecord/test/cases/adapter_test.rb`
word-for-word: same `describe`/`it` names, same setup/fixtures, same assertions.
Ride canonical `TEST_SCHEMA` + official `test-helpers/models/*` + real fixtures;
no bespoke tables, no invented columns, no `_tableName` hack. adapter_test.rb is
large (~36 KB) — split across PRs by sub-cluster under the 500-LOC ceiling if
needed, each chunk all-or-nothing.

## Acceptance criteria

- [ ] `adapter.test.ts` mirrors `adapter_test.rb` test-by-test (names verbatim).
- [ ] Canonical schema only; add to `TEST_SCHEMA` if schema.rb has something it lacks.
- [ ] Surfaced impl gaps → fix impl or file under `0023-surfaced-deviations`
      (tracked-pending-convergence); do not bend the test. Temporary
      `test:compare` regression acceptable — record the un-skip.
- [ ] 500-LOC ceiling; single PR from main; all-or-nothing per file.
