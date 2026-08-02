---
title: "Scope reachable Rails defs by class/module nesting, not a flat regex"
status: done
updated: 2026-08-02
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 5839
claim: "2026-08-01T23:46:00Z"
assignee: "codegen-scope-defs-respect-class-nesting"
blocked-by: null
closed-reason: null
---

## Context

`reachableRailsDefs` (`scripts/prism-codegen/rails-scope.ts`, merged in #5829)
collects `def`s with a flat line regex (`RUBY_DEF`), blind to class/module
nesting. Inner-class methods count as reachable from the outer file: Rails'
`Relation::ExplainProxy` (`vendor/rails/activerecord/lib/active_record/relation.rb:6-47`)
defines `pluck`, `sum`, `average`, `count`, so `reachableRailsDefs("active_record/relation.rb")`
reports them as `Relation` instance methods.

This errs toward the old wider scope (it never drops a name the file really can
dispatch to), so it is not a regression — but it is exactly the imprecision the
scoping story existed to remove, and it becomes behavioural under
`codegen-apply-scaffolding`.

`scripts/prism-codegen/linearization.ts` already has a prism-based,
nesting-aware `indexModuleDefs()` that skips `SingletonClassNode` and keys defs
by module path. The fix is to source `reachableRailsDefs` from that index
instead of the regex (which makes it async — `asyncMethodsForRailsFile` and its
callers in `golden.ts` / `score-cli.ts` / `from-ts.ts` / `apply-cli.ts` are
already in async contexts).

## Acceptance criteria

- `reachableRailsDefs` (or its replacement) attributes each `def` to its
  enclosing class/module, so `Relation::ExplainProxy#pluck` is not reported as
  reachable from `active_record/relation.rb` unless another module in the
  ancestry defines it.
- A test covers an inner-class `def` whose name exists nowhere else in the
  ancestry and asserts it is out of scope.
- `pnpm codegen:score` matched count does not regress; goldens regenerated and
  any dropped await confirmed to be an inner-class name.
