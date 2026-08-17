---
title: "Non-bang query methods call spawn, not clone (spawn_methods.rb:10)"
status: done
updated: 2026-08-17
rfc: "0107-relation-ts-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6624
claim: "2026-08-17T01:02:54Z"
assignee: "port-hwia-bang-forms-and-to-options"
blocked-by: null
closed-reason: null
---

## Context

Reopens the ground `converge-clone-call-sites-onto-spawn` was closed on. That story
was closed 2026-08-16 as a duplicate of `retire-relation-parallel-spawn-and-clone-path`,
but PR #6617 (which landed that story) deliberately did NOT touch the call sites: it
renamed `_clone()` -> `clone()` everywhere and left the ~90 call sites calling `clone()`,
because swapping them to `spawn()` is a behavior change and that story's acceptance
criteria required "no behavior change". So the divergence is still live and now has no
owner.

Rails' non-bang query methods all go through `spawn`, never `clone`:

- `none` — query_methods.rb:1281-1283 (`spawn.none!`)
- `lock` — query_methods.rb:1238-1240
- `where` — query_methods.rb:686-689
- `limit`, `offset`, `order`, `select`, `distinct`, `group`, `having`, `readonly`,
  `strict_loading`, `annotate`, `optimizer_hints`, `from`, `create_with`, `unscope`,
  `extending`, `includes`, `preload`, `eager_load`, `with`, `references`, ... — same shape.

`spawn` is not `clone` (spawn_methods.rb:9-11):

```ruby
def spawn # :nodoc:
  already_in_scope?(model.scope_registry) ? model.all : clone
end
```

trails already has both: `performSpawn` (relation/spawn-methods.ts) implements exactly
that line, and `Relation#clone` (relation.ts, post-#6617) is the `clone` arm. The call
sites just skip `spawn` and reach `clone` directly, so the `already_in_scope?` arm is
dead on every one of them.

## Converged shape

Every non-bang query method calls `this.spawn().fooBang(...)`, matching its Rails line.
Call sites live in `relation.ts` and — since #6616 moved ten of them — in
`relation/query-methods.ts` (`unscope`, `lock`, `none`, `readonly`, `strictLoading`,
`createWith`, `from`, ...), plus `relation/batches.ts`, `relation/calculations.ts`,
`relation/finder-methods.ts`, `associations/preloader/through-association.ts`, `base.ts`.

Note this IS a behavior change where `already_in_scope?` is true — a relation that is
the model's current scope while running as a scope body re-derives from `model.all`
instead of copying. `spawn-already-in-scope.trails.test.ts` covers that predicate today;
expect to extend it. Land the sweep in slices if the diff exceeds the LOC ceiling
(the `relation.ts` sites and the `relation/*.ts` sites are separable, non-overlapping files).

## Acceptance criteria

- [ ] No non-bang query method calls `this.clone()` directly; each calls `this.spawn()`,
      at the Rails line cited in its JSDoc.
- [ ] `clone()` is reached only through `performSpawn` (spawn_methods.rb:10) and the
      internal load-clone paths that are genuinely `clone`, not `spawn`, in Rails.
- [ ] `spawn-already-in-scope.trails.test.ts` still passes and covers the arm that
      now actually fires from user-facing chains.
- [ ] `pnpm parity:api:calls` / `:args` clean; SQLite, PostgreSQL, MySQL/MariaDB green.
