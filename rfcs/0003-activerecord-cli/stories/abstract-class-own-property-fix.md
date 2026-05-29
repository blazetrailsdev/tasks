---
title: "Fix _abstractClass own-property check (core bug)"
status: ready
rfc: "0003-activerecord-cli"
cluster: core
deps: []
deps-rfc: []
est-loc: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`primaryAbstractClass()` / `abstractClass = true` sets `_abstractClass` on
`ApplicationRecord`; concrete models **inherit** it via the prototype chain.
`loadSchemaFromAdapter` and `loadSchemaFromCacheSync` read `this._abstractClass`
**un-guarded** (`model-schema.ts:819`, `:890`, `:392`), so every model under an
`ApplicationRecord` is wrongly treated as abstract and **skips reflection** —
producing `INSERT … DEFAULT VALUES`.

Rails' `abstract_class?` is per-class (own-property only); `inheritance.ts`'s
`getAbstractClass` already guards with `hasOwnProperty`.

See RFC 0003 §Core changes (§6.2).

## Acceptance criteria

- [ ] `model-schema.ts` uses an own-property check for `_abstractClass` at the
      three sites (~819, ~890, ~392)
- [ ] `class X extends ApplicationRecord` reflects its schema (no
      `INSERT … DEFAULT VALUES`)
- [ ] Regression test for a concrete model under an abstract base

## Notes

~10 LOC, high value, orthogonal to all the packaging work — **ship standalone**.
Source: #2638. Unblocks the common `extends ApplicationRecord` pattern the
twitter-clone example had to avoid.
