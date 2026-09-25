---
title: "build-default-scope-instance-exec-scope-body"
status: ready
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 70
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# buildDefaultScope instance_execs the scope body on combined_scope

## Context

`ActiveRecord::Scoping::Default::ClassMethods#build_default_scope`
(`vendor/rails/activerecord/lib/active_record/scoping/default.rb:158-166`) folds
the default scopes with
`scope = scope_obj.scope.respond_to?(:to_proc) ? scope_obj.scope : scope_obj.scope.method(:call)`
and then `combined_scope.instance_exec(&scope) || combined_scope`. The scope body
runs with `self` as the combined scope and takes no argument.

trails' `buildDefaultScope` (`packages/activerecord/src/scoping/default.ts`)
calls `scopeObj.scope(combinedScope)` instead, passing the relation as an
argument. The `respond_to?(:to_proc)` / `method(:call)` arm is not ported.

This surfaced once the call-args comparator stopped prepending a Ruby receiver
to a TS site that has its own receiver. The row is `scope()` against
`scope(ref:combinedScope)`, receipted `@missingRailsArgs scope — CONVERGEABLE`
pointing here.

## Acceptance criteria

- [ ] The scope body is invoked with the combined scope as `this`
      (`instanceExec`), with no positional argument, matching `default.rb:162`.
- [ ] The `to_proc` / `method(:call)` arm is ported.
- [ ] The `@missingRailsArgs scope` receipt on `buildDefaultScope` is deleted.
