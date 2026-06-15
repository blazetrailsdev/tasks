---
title: "schema-statements-on-adapter.test.ts: use ambient connection, not :memory:"
status: draft
updated: 2026-06-15
rfc: "0000-sqlite-memory-fidelity"
cluster: test-connection-fidelity
deps: []
deps-rfc: []
est-loc: 50
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`connection-adapters/abstract/schema-statements-on-adapter.test.ts` hardcodes
`:memory:` (6 occurrences). Rails exercises abstract `SchemaStatements`
behavior (`cases/migration/*`, `cases/schema_dumper`, adapter schema tests)
over the ambient, file-backed test connection — DDL against a real file, where
schema introspection and migration journaling behave as in production.

## Acceptance criteria

- [ ] The 6 `:memory:` sites run schema-statement DDL/introspection against the
      ambient test connection (or a derived file-backed config), matching how
      Rails' migration/schema-statement tests bind to the default connection.
- [ ] Verify each case against its nearest Rails counterpart
      (`cases/migration/`, `cases/ar_schema_test.rb`, adapter schema tests);
      cite the file in the PR.
- [ ] Test names unchanged; behavior matches Rails.
- [ ] CI green on all three adapters; `test:compare` delta non-negative.

## Notes

This is the least directly-mapped of the ambient cluster — confirm the Rails
counterpart per case before converging. If a case is genuinely trails-only
(testing the abstract host in isolation), document why `:memory:` stays.
</content>
