---
title: "abstract-fk-mutators-use-foreign-keys-guard"
status: ready
updated: 2026-07-06
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Several abstract `SchemaStatements` FK methods lack Rails' `return unless
use_foreign_keys?` top guard
(vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1174,
1215, 1766; `use_foreign_keys?` at :1545). In trails
(packages/activerecord/src/connection-adapters/abstract/schema-statements.ts)
`addForeignKey`, `removeForeignKey`, and related FK methods run unconditionally;
`isUseForeignKeys()` exists and is consulted in `foreignKeyFor` but not at the
top of these mutators.

Surfaced reviewing PR #3803 (abstract addForeignKey convergence). Not a
regression — the guard was absent before — but now the converged path is the
shared body for all adapters, so the missing guard is exercised broadly.

## Acceptance criteria

- [ ] `addForeignKey` / `removeForeignKey` (and any sibling FK mutators Rails
      guards) begin with `if (!this.isUseForeignKeys()) return;`, mirroring
      Rails' `return unless use_foreign_keys?`.
- [ ] Verify `isUseForeignKeys()` default matches Rails `use_foreign_keys?`
      (true for adapters that support FKs) so no adapter regresses.
- [ ] api:compare and test:compare delta non-negative; no test-name changes.
