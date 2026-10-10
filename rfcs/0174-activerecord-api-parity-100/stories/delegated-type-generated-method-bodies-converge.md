---
title: "delegated_type: #{role}_class/_name/build_#{role} bodies diverge from delegated_type.rb:246-256"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#6901 restored Rails' direction (`delegatedType` calls `defineDelegatedTypeMethods`), but the
generated method bodies in `packages/activerecord/src/delegated-type.ts` still differ from
`vendor/rails/v8.0.2/activerecord/lib/active_record/delegated_type.rb:237-279`:

- `#{role}_class` (`delegated_type.rb:246-248`) is `public_send(role_type).constantize`, with no
  nil guard. trails (`delegated-type.ts:85-93`) returns `null` when the type column is blank, where
  Rails raises (`nil.constantize` → NoMethodError).
- `#{role}_name` (`:250-252`) is `public_send("#{role}_class").model_name.singular.inquiry`. trails
  (`:95-103`) instead underscores the raw type string itself (`underscore(typeName).replace(/\//g, "_")`)
  and has the same invented `null` guard. It never goes through `#{role}Class` or `modelName.singular`,
  so a namespaced or custom `model_name` gives a different answer.
- `build_#{role}(*params)` (`:254-256`) is `public_send("#{role}=", public_send("#{role}_class").new(*params))`.
  trails (`:105-121`) re-resolves the class inline instead of calling `#{role}Class`, and throws an
  invented `Error("Cannot build…: … is not set")` that Rails does not have.

## Converged shape

```ts
get [`${role}Class`]() { return constantize(this[roleType]); }            // + autoloadModel if still required
get [`${role}Name`]()  { return inquiry.call(this[`${role}Class`].modelName.singular); }
[`build${Role}`](...params) { this[role] = new this[`${role}Class`](...params); return ...; }
```

Each method reaches the attribute through the reader (`public_send(role_type)`), and the `name` and
`build` methods go through `#{role}Class` exactly as Rails does.

## Acceptance criteria

- No `if (!typeName)` guards and no invented `Error` in the three generated methods.
- `#{role}Name` is `#{role}Class.modelName.singular` wrapped in `inquiry`, and `build#{Role}` calls
  `#{role}Class`.
- `delegated-type.test.ts` and `delegated-type-scope.test.ts` pass. Port any `delegated_type_test.rb`
  case that asserts the nil / namespaced behaviour.
- `pnpm parity:api:calls` passes with no new baseline rows.
