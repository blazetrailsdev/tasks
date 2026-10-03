---
title: "activemodel: AttributeSet sends key?/each_key/fetch to @attributes on one path, Hash or LazyAttributeHash"
status: in-progress
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8439
claim: "2026-10-03T09:25:23Z"
assignee: "activemodel-binary-data-hex-open-codes-unpack1"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_set.rb` sends `[]`, `[]=`, `key?`,
`each_key` and `fetch` to `@attributes`, which is a Hash or a `LazyAttributeHash`
(`attribute_set.rb:17,21,42,47,94`). `packages/activemodel/src/attribute-set.ts:50-80` routes each
through an invented module helper (`isHash`, `aref`, `aset`, `isKey`, `eachKey`, `fetch`) that
branches on `isHash(attributes)`.

trails#8422 made ruby-compat's `hasKey` / `fetch` / `eachKey` / `keys` reach a non-Hash receiver's
own `isKey` / `fetch` / `eachKey` / `keys`, which is how `LazyAttributeSet` now reads a Hash or an
`IndexedRow` on one path. `LazyAttributeHash` defines `isKey`, `eachKey` and `fetch`
(`packages/activemodel/src/attribute-set/builder.ts`), so the same sends can replace those helpers.

## Acceptance criteria

- [ ] `AttributeSet`'s bodies call ruby-compat's `hasKey` / `eachKey` / `fetch` on `this._attributes`
      directly, and the `isHash` / `isKey` / `eachKey` / `fetch` helpers are deleted.
- [ ] `[]` / `[]=` read and write `@attributes` through one spelling: a `hashAref` / `hashAset` send
      if ruby-compat gains the receiver dispatch for it, else filed with the blocker.
- [ ] `builder-defaults.trails.test.ts` and `attribute-set*.test.ts` pass unchanged.
