---
title: "converge-clone-call-sites-onto-spawn"
status: closed
updated: 2026-08-16
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Duplicate of retire-relation-parallel-spawn-and-clone-path (in-progress), which already owns retiring _clone/_newRelation in favour of spawn (spawn_methods.rb:9-11) + initializeCopy (relation.rb:97). The ten methods PR #6616 moved into relation/query-methods.ts use the same this._clone() idiom and are covered by that story's call-site sweep."
---

## Context

Every non-bang query method in Rails is `spawn.foo!(...)` — `none`
(query_methods.rb:1281-1283), `lock` (:1238-1240), `where` (:686-689),
`limit`, `order`, and the rest. `spawn` is not `clone`
(spawn_methods.rb:9-11):

```ruby
def spawn
  already_in_scope?(klass.scope_registry) ? klass.all : clone
end
```

trails spells all of them `this._clone().fooBang(...)`, skipping the
`already_in_scope?` arm entirely. There are 24 such call sites left in
`packages/activerecord/src/relation.ts`, plus the ten moved into
`packages/activerecord/src/relation/query-methods.ts` by PR #6616
(`unscope`, `lock`, `none`, `readonly`, `strictLoading`, `createWith`,
`from`, `extending`, `optimizerHints`, `annotate`), which carried the
existing idiom over rather than flipping half the surface mid-move.

trails already has the faithful `spawn` — `performSpawn`
(`relation/spawn-methods.ts`) implements exactly the Ruby above and is mixed
in as `Relation#spawn`. So this is a call-site sweep, not new machinery.

## Acceptance criteria

- Every `this._clone().fooBang(...)` that stands for Rails' `spawn.foo!` calls
  `spawn()` instead, in both `relation.ts` and `relation/query-methods.ts`.
- `_clone()` survives only where Rails itself calls `clone`/`initialize_copy`
  directly.
- The `relation/`, `scoping/` and `named-scope` suites pass — in particular the
  `already_in_scope?` arm must not fire during ordinary named-scope use
  (`_exec_scope` nils the current scope for the body's duration).
