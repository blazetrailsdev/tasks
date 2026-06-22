---
title: "statement-cache.test.ts: run against ambient connection like Rails"
status: draft
updated: 2026-06-15
rfc: "0029-sqlite-memory-fidelity"
cluster: test-connection-fidelity
deps: []
deps-rfc: []
est-loc: 50
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`statement-cache.test.ts` hardcodes `:memory:` (8 occurrences). Rails'
`statement_cache_test.rb` uses no `:memory:` — it runs against the ambient,
file-backed test connection with `fixtures :books` / model queries
(`Book`, `Liquid`, etc.), exercising the statement cache over the real default
database.

## Acceptance criteria

- [ ] StatementCache cases run against the ambient test connection / canonical
      models + fixtures, matching `statement_cache_test.rb`, instead of
      establishing private `:memory:` connections.
- [ ] Any model/table the cases need exists in `TEST_SCHEMA` (do not invent
      tables — see memory `feedback_canonical_schema_no_invented_tables`; mirror
      the Rails models the test uses).
- [ ] Test names unchanged; behavior matches the Rails test.
- [ ] CI green on all three adapters; `test:compare` delta non-negative.

## Notes

Read `vendor/rails/activerecord/test/cases/statement_cache_test.rb` first.
</content>
