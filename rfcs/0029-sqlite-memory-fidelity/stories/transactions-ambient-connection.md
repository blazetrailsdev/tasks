---
title: "transactions.test.ts: run against ambient connection like Rails"
status: closed
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: test-connection-fidelity
deps: []
deps-rfc: []
est-loc: 45
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already delivered: transactions.test.ts now rides canonical fixtures (topics/developers/authors/posts) on the ambient connection; zero :memory: sites remain on main."
---

## Context

`transactions.test.ts` hardcodes `:memory:` (4 occurrences). Rails'
`transactions_test.rb` uses no `:memory:` — it runs against the ambient,
file-backed test connection with `fixtures :topics, :developers, …` and the
canonical models. File-backed matters for transaction tests: durability,
rollback-to-disk, and WAL behavior are exactly what `:memory:` papers over.

## Acceptance criteria

- [ ] The 4 `:memory:` sites run against the ambient test connection /
      canonical models, matching `transactions_test.rb`, rather than private
      in-memory connections.
- [ ] Tables used exist in `TEST_SCHEMA`; mirror the Rails models/fixtures the
      corresponding cases use (no invented tables).
- [ ] Test names unchanged; behavior matches the Rails test.
- [ ] CI green on all three adapters; `parity:test` delta non-negative.

## Notes

Read `vendor/rails/activerecord/test/cases/transactions_test.rb` for the exact
cases these 4 sites correspond to before converging.
</content>
