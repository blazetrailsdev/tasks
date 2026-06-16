---
title: "id getter reads undefined column for key-less table instead of returning null"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced in PR #3428 review (RFC 0030 `cc-id-setter-missing-attribute`). That PR
made `setId` (`packages/activerecord/src/attribute-methods/primary-key.ts:114`)
raise `MissingAttributeError` for a key-less table (`primaryKey` resolves to
`null`), matching Rails `AttributeMethods::PrimaryKey#id=`.

The read side is asymmetric and untracked. `getId`
(`attribute-methods/primary-key.ts:103`) types `pk` as `string | string[]` and,
for a key-less data source (e.g. a view, `primaryKey` → `null`), calls
`this._readAttribute(pk)` with `pk == null` → `_readAttribute(undefined)`.

Rails' `AttributeMethods::PrimaryKey#id` reads through the AttributeSet's Null
attribute and returns `nil` without raising (the read path does not raise the way
the write path does). So our getter should return `null` for a key-less table,
not read an undefined column.

Related (type-level, already shipped): `0023-surfaced-deviations`
`primary-key-null-return-type-for-views` (PR #3372) — that covered the
`primary_key` return-type contract, not this `id` getter runtime behavior.

## Acceptance criteria

- [ ] `instance.id` returns `null` (no raise) when the model's primary key
      resolves to `null` (key-less table / view), matching Rails
      `AttributeMethods::PrimaryKey#id`.
- [ ] Add a test mirroring the Rails behavior (anon class on `dashboards`,
      `new().id === null`).
- [ ] No behavior change for models with a real (scalar or composite) primary key.
- [ ] Single PR from main, ≤ ceiling.
