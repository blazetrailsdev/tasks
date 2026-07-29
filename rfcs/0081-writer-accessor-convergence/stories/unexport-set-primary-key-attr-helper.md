---
title: "unexport-set-primary-key-attr-helper"
status: claimed
updated: 2026-07-29
rfc: "0081-writer-accessor-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-29T03:15:44Z"
assignee: "unexport-set-primary-key-attr-helper"
blocked-by: null
closed-reason: null
---

## Context

Found by the `audit-setx-functions-without-rails-counterpart` audit; a missed
member of RFC 0081 shape 1 (`unexport-redundant-writer-helpers-activerecord`,
PR #5390), which shipped before this one was spotted.

`packages/activerecord/src/attribute-methods/primary-key.ts:230` exports
`setPrimaryKeyAttr`, a faithful port of
`ActiveRecord::AttributeMethods::PrimaryKey::ClassMethods#primary_key=`
(`vendor/rails/activerecord/lib/active_record/attribute_methods/primary_key.rb:130`).
`Base` already exposes the Rails-named accessor that delegates to it:

```ts
// base.ts:1157
static set primaryKey(key: string | string[]) {
  _setPrimaryKeyAttr.call(this, key);
}
```

So the exported helper is redundant public surface. It was classified as
"no Rails counterpart" only because of the `Attr` suffix on the TS name.

Second call site to keep working: `primary-key.ts:254`.

## Acceptance criteria

- `setPrimaryKeyAttr` is module-private, or stays `@internal` and is removed
  from any barrel/index re-export, per the shape-1 rule.
- `Base.primaryKey =` and the `primary-key.ts:254` caller keep working;
  primary-key and composite-PK tests pass with names unchanged.
- `pnpm api:extra` reports one fewer activerecord extra and no stale entries.
