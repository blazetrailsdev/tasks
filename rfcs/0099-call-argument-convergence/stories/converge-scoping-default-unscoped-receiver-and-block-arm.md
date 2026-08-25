---
title: "this-type Default.unscoped and restore its missing block/scoping arm"
status: done
updated: 2026-08-13
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6477
claim: "2026-08-13T16:45:43Z"
assignee: "fold-grouped-composite-assoc-into-one-grouped-body"
blocked-by: null
closed-reason: null
---

## Context

PR #6469 converged `Default.buildDefaultScope` to the `this`-typed idiom (CLAUDE.md
"Module mixins"), so its body says `this` where Rails says `self`, and it now
takes the built `relation` rather than a trails-only thunk. Its sibling in the
same class was left untouched and still carries both deviations:

`packages/activerecord/src/scoping/default.ts`:

```ts
static unscoped(modelClass: any, buildRelation: () => any): any {
  return buildRelation();
}
```

Rails (`activerecord/lib/active_record/scoping/default.rb:17-26`):

```ruby
def unscoped(&block)
  block_given? ? relation.scoping(&block) : relation
end
```

Two divergences:

1. The receiver is an explicit leading `modelClass` parameter where Rails uses
   `self`, and the relation arrives as a thunk where Ruby's `relation()` is
   evaluated at call time. This is the exact shape #6469 retired from
   `buildDefaultScope` in the same file.
2. **The block arm is missing entirely.** Rails' `unscoped` takes an optional
   block and, when given one, runs it inside `relation.scoping`; the TS body
   returns the relation unconditionally and never scopes. A caller passing a
   block gets no scoping at all.

Divergence 2 is the behavioural one and is the reason this is not a pure
rename. Check the trails call sites of `unscoped` before assuming the block arm
is unreachable — `Base.unscoped` and `relation.scoping` both exist.

## Converged shape

`static unscoped(this: any, block?: () => any)` on `Default`, body mirroring
`block_given? ? relation.scoping(&block) : relation` against a relation built
at call time, with call sites passing the receiver via `.call(model, ...)` as
the `buildDefaultScope` sites now do.

## Acceptance criteria

- [ ] `Default.unscoped` is `this`-typed and takes no thunk.
- [ ] The block arm routes through `scoping`, matching `default.rb:17-26`.
- [ ] `scoping/default-scoping.test.ts` and `scoping/relation-scoping.test.ts`
      pass on all three adapters.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with
      no baseline row added.
