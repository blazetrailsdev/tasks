---
title: "indexesInCreate filters constraint-backed indexes through an invented filterIndexesForDump hook"
status: claimed
updated: 2026-08-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: "2026-08-28T14:07:26Z"
assignee: "db-schema-load-sql-reports-success-for-memory-noop"
blocked-by: null
closed-reason: null
---

## Context

Rails does the constraint-backed-index filtering INSIDE `indexes_in_create`
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:244-256`): it
reads `@connection.indexes(table)`, then rejects the indexes whose names match
an exclusion constraint or a unique constraint, behind
`supports_exclusion_constraints?` / `supports_unique_constraints?`:

```ruby
def indexes_in_create(table, stream)
  if (indexes = @connection.indexes(table)).any?
    if @connection.supports_exclusion_constraints? && (exclusion_constraints = ...).any?
      indexes = indexes.reject { |index| exclusion_constraint_names.include?(index.name) }
    end
    if @connection.supports_unique_constraints? && (unique_constraints = ...).any?
      indexes = indexes.reject { |index| unique_constraint_names.include?(index.name) }
    end
    ...
```

trails hoists both the read and the rejection out to `table()`, which calls a
`filterIndexesForDump(table, indexes)` hook
(`packages/activerecord/src/schema-dumper.ts:857`, hook declared at `:930-935`,
PostgreSQL override in
`packages/activerecord/src/connection-adapters/postgresql/schema-dumper.ts`) and
passes the filtered list into `indexesInCreate` as a third argument — an
adapter-dispatched hook Rails does not have, plus a parameter Rails' two-arg
`indexes_in_create(table, stream)` does not take. The third argument already
carries a `@missingRailsArgs` receipt on `table()`; the hook itself is the extra
surface.

Surfaced landing PR #7130
(`schema-dumper-in-create-emitters-write-after-the-block`), which converged the
emission point and left the filtering split as-is, out of that story's scope.

## Converged shape

Fold the rejection back into `indexesInCreate`, guarded by
`supportsExclusionConstraints?()` / `supportsUniqueConstraints?()` as Rails
guards it, and delete `filterIndexesForDump` and its PostgreSQL override. The
blocker is that `indexesInCreate` is synchronous while
`exclusionConstraints(table)` / `uniqueConstraints(table)` are async reads in
trails — the same shortcoming the existing `@missingRailsCall` receipts on
`indexesInCreate` record. Whichever way that is resolved (make the emitter
async, or prefetch both lists in `table()` and hand them in), the branch
structure and the rejection belong in `indexesInCreate`, not behind an invented
adapter hook.

## Acceptance criteria

- [ ] The exclusion/unique name rejection happens inside `indexesInCreate`,
      branch-for-branch with `schema_dumper.rb:245-256`.
- [ ] `filterIndexesForDump` and its PostgreSQL override are gone; no
      replacement hook takes their place.
- [ ] `parity:api:extra --package activerecord` does not gain surface, and
      "schema does not dump unique constraints as indexes" plus the PG
      exclusion-constraint dump tests stay green.
