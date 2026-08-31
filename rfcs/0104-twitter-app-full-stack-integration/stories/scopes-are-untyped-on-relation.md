---
title: "Scopes only type-check at the head of a chain; Relation<T> never learns the name"
status: draft
updated: 2026-08-13
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 120
priority: 53
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`this.scope(name, fn)` defines the scope at runtime, but nothing declares it
on the model class or on `Relation<T>`, so a scope only type-checks at the
head of a chain. The second scope in a chain is a type error even though it
runs correctly.

Works — the scope resolves off the class:

```ts
await Tweet.roots().where({ user_id: ids }).order({ created_at: "desc" });
```

Fails to type-check, though it executes:

```ts
await Tweet.where({ user_id: ids }).roots().recent();
// Property 'roots' does not exist on type 'Relation<Tweet>'.
// Property 'recent' does not exist on type 'Relation<Tweet>'.
```

`scope`'s signature is
`fn: (rel: Relation<InstanceType<T>>, ...args: any[]) => Relation<any>`
(`packages/activerecord/src/scoping/named.ts:92-97`), and the runtime
installs the method on the model and its relations — but the type system
never learns the name.

Rails has no analogue: `scope` defines a singleton method and relations
respond through `method_missing` / `Relation#scoping`, so
`Tweet.where(...).roots.recent` chains freely
(`activerecord/lib/active_record/scoping/named.rb:150-192`).

`examples/twitter-app` works around it by putting one scope at the head of
each chain and spelling the remaining conditions out inline — see
`src/app/controllers/tweets-controller.ts#index` and
`src/app/controllers/explore-controller.ts#index`. The scopes are still
defined and exercised (`Tweet.roots()`, `Tweet.popular()`, `User.chatty()`),
they just cannot be composed under the type checker.

## Converged shape

`scope` returns a type-level registration so the name lands on both the model
class and `Relation<T>` — e.g. a declaration-merging helper the way
`trails-tsc` already injects attribute `declare` members from `db/schema.ts`,
or a generic `scope<Name extends string>` that widens the model's relation
type. Chained scopes must type-check in the order Rails allows.

## Acceptance criteria

- `Tweet.where(...).roots().recent()` type-checks and runs.
- Scopes are visible on both the model class and `Relation<T>`.
- `examples/twitter-app` restores the natural chains and drops the
  head-of-chain comments.
