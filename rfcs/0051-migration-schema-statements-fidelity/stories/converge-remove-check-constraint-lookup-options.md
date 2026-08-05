---
title: "Converge removeCheckConstraint's lookup options and if_exists probe"
status: done
updated: 2026-08-05
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 50
pr: 6118
claim: "2026-08-05T03:29:59Z"
assignee: "port-respond-to-missing-finder-to-dynamic-matchers"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#removeCheckConstraint`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
the `removeCheckConstraint` body around the `checkConstraintFor` call) diverges
from Rails' `remove_check_constraint`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1324-1335`)
in two ways.

**1. The lookup is narrowed.** Rails passes the full option set through:

```ruby
chk_name_to_delete = check_constraint_for!(table_name, expression: expression, **options).name
```

trails instead builds a two-key lookup (`{ expression }`, plus `name` when
defined) and drops everything else. Since `CheckConstraintDefinition#isDefinedFor`
compares `validate` (`schema-definitions.ts`, mirroring `defined_for?` at
`schema_definitions.rb:189-195`), a caller passing `validate:` has it honored in
Rails and silently ignored in trails.

**2. The `if_exists` short-circuit is fused into the bang lookup.** Rails is two
distinct steps:

```ruby
return if if_exists && !check_constraint_exists?(table_name, **options)
chk_name_to_delete = check_constraint_for!(table_name, expression: expression, **options).name
```

Note the probe passes `**options` **without** the positional `expression`, while
the bang lookup includes it. trails collapses both into one `checkConstraintFor`
call and branches on `opts.ifExists` in the not-found arm, so the probe and the
lookup can no longer disagree the way Rails' can.

Found during review of PR #5824
(`converge-check-constraint-exists-on-the-supports-guard`), which converged
`checkConstraintExists` and deliberately left `removeCheckConstraint` untouched
to keep that PR scoped.

## Note

The hand-rolled `if (opts.name !== undefined)` guard at that call site (added to
stop an explicit `name: undefined` clobbering the derived name) is now
belt-and-braces: PR #5824 fixed `isDefinedFor` to mirror `nil.to_s == ""`, so a
nullish name yields `false` rather than a `TypeError`. Re-evaluate whether the
guard should survive convergence.

## Acceptance criteria

- `removeCheckConstraint` passes the full option set to `checkConstraintForBang`,
  matching `schema_statements.rb:1329`, so `validate:` participates in matching.
- The `if_exists` path mirrors Rails' separate `check_constraint_exists?` probe
  (options only, no expression) ahead of the bang lookup.
- A regression test pins `validate:`-aware matching and fails on baseline.
- SQLite, MySQL and PostgreSQL lanes green.
