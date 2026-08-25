---
title: "SchemaMigration/InternalMetadata count project NamedFunction(COUNT) with an invented alias, not Arel::Nodes::Count"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6265
claim: "2026-08-09T00:15:03Z"
assignee: "date-parse-union-return-is-ts-static-side-variance"
blocked-by: null
closed-reason: null
---

## Context

Rails builds the count projection with `Arel::Nodes::Count`
(`vendor/rails/activerecord/lib/active_record/schema_migration.rb:91-93` and
`internal_metadata.rb:64-66`), splatted into `project`:

```ruby
sm = Arel::SelectManager.new(arel_table)
sm.project(*Arel::Nodes::Count.new([Arel.star]))
```

trails (`packages/activerecord/src/schema-migration.ts` and
`internal-metadata.ts`, both `count`) uses a different Arel node and adds an
alias Rails does not have:

```ts
const sm = new SelectManager(this.arelTable);
sm.project(new Nodes.NamedFunction("COUNT", [star]).as("cnt"));
```

Two deviations: `NamedFunction("COUNT", ...)` stands in for the dedicated
`Nodes.Count`, and the `.as("cnt")` alias is invented — Rails projects the bare
count node, so the emitted SQL carries no `AS cnt`.

Surfaced in PR #6262 while converging the same two bodies' return values
(`collaborator-count-coerces-where-rails-answers-select-values-first`); the
projection was outside that story's scope.

## Converged shape

Both bodies build `new Nodes.Count([star])` and project it bare, with no alias,
matching `:91-93` / `:64-66`. Confirm `Arel::Nodes::Count` exists in
`packages/arel` and port it if it does not — `Count` is a real Arel node
(`vendor/rails/activerecord/lib/arel/nodes/count.rb`), not a helper.

## Acceptance criteria

- [ ] Both `count` bodies project `Nodes.Count`, not `NamedFunction("COUNT")`.
- [ ] The `.as("cnt")` alias is gone; the emitted SQL matches Rails'.
- [ ] Green on all four AR lanes.
