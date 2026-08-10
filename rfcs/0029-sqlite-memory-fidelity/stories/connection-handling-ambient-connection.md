---
title: "connection-handling.test.ts: use ambient/connects_to config, not :memory:"
status: done
updated: 2026-07-25
rfc: "0029-sqlite-memory-fidelity"
cluster: test-connection-fidelity
deps: []
deps-rfc: []
est-loc: 55
priority: 5
pr: 5286
claim: "2026-07-25T02:22:53Z"
assignee: "connection-handling-ambient-connection"
blocked-by: null
---

## Context

`connection-handling.test.ts` hardcodes `:memory:` (7 occurrences). Rails'
`connection_handling_test.rb` uses no `:memory:` at all — it drives
`connects_to` / `connected_to` against the ambient, file-backed test
configuration (the `default_env` configs registered for the test process).

## Acceptance criteria

- [ ] Connection-handling cases derive their database configs from the ambient
      test configuration (or register named configs that point at file-backed
      DBs), mirroring `connection_handling_test.rb`'s `connects_to`/
      `connected_to` usage — not literal `:memory:` hash configs.
- [ ] Where the test needs multiple roles/shards, the configs follow Rails'
      structure (read the Rails test for which roles share a database).
- [ ] Test names unchanged; behavior matches the Rails test.
- [ ] CI green on all three adapters; `parity:test` delta non-negative.

## Notes

Read `vendor/rails/activerecord/test/cases/connection_handling_test.rb` first
to confirm which config the handling cases bind to. Reuse the ambient helper if
present.
</content>
