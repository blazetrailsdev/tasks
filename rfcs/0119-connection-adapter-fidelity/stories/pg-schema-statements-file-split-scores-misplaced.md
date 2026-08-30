---
title: "pg-schema-statements-file-split-scores-misplaced"
status: done
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7247
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/schema-statements-class.ts`
carries eleven `@noRailsEquivalent` receipts whose reason is not that the method
is novel but that the port SPLIT `postgresql/schema_statements.rb` across files,
so each scores misplaced rather than matched: `validate_constraint` (:893),
`assert_valid_deferrable` (:1031), `extract_foreign_key_action` (:1023),
`extract_constraint_deferrable` (:1037), `exclusion_constraint_name` (:1078),
`exclusion_constraint_for` (:1088), `exclusion_constraint_for!` (:1093),
`unique_constraint_name` (:1098), `unique_constraint_for` (:1108),
`unique_constraint_for!` (:1113), and the sequence-name interpolation of
`default_sequence_name` (:301).

A file split is a port decision, not a TypeScript shortcoming; the convergence
is to put each method in the file `parity:api`'s path convention maps
`postgresql/schema_statements.rb` to.

## Acceptance criteria

- The eleven methods live where the Rails file maps, and their
  `@noRailsEquivalent CONVERGEABLE pg-schema-statements-file-split-scores-misplaced`
  receipts are deleted.
- `pnpm parity:api --package activerecord` file/method match counts do not drop.
