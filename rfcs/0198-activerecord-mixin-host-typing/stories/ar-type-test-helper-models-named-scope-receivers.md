---
title: "Type named scopes so test-helper model scope bodies drop their remaining this: any"
status: done
updated: 2026-10-20
rfc: "0198-activerecord-mixin-host-typing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#9142
claim: "2026-10-20T16:39:48Z"
assignee: "ar-type-test-helper-models-named-scope-receivers"
blocked-by: null
closed-reason: null
---

## Context

After trails#9124, `packages/activerecord/src/test-helpers/models/**` still has 103 hits for the RFC grep (`this: any|(this as any|unknown)|as any|as unknown as`). Most remaining `this: any` are scope / association-scope bodies that call a model's own named scope (e.g. `author.ts` `commentsWithOrder`: `this.orderedByPostId()`), which `Relation<any>` / `Relation<InstanceType<T>>` cannot type because `scope()` (`packages/activerecord/src/scoping/named.ts:18`) defines methods at runtime with no type-level record. Rails: `scope` defines a class method plus a relation delegate (`vendor/rails/v8.0.2/activerecord/lib/active_record/scoping/named.rb`, `scope`). Other leftovers are `(this as any)` in class-method bodies (`post.ts` `top`, `rankedByComments().limitBy`) and `as unknown as typeof Base` in `initializeRelationDelegateCache` calls.

## Acceptance criteria

- [ ] Named scopes are typed on the model (declare-merged statics, e.g. `declare static orderedByPostId: ScopeMethod<Comment>`), or the relation type carries them, so the scope bodies that call them drop `this: any`.
- [ ] The models count drops from 103 by at least 50%.
- [ ] Typing only: no runtime change, `pnpm parity:api:extra:gate` green, `pnpm typecheck` green.
