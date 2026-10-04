---
title: "rbPathToClass resolves no core class, so Marshal.load needs Hash seated by the caller"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `ruby-compat-marshal-load-core-types`. `rbPathToClass`
(`packages/ruby-compat/src/variable.ts`) ports `rb_path_to_class`
(`vendor/ruby/v3.3.11/variable.c:432-474`), which starts its walk at `rb_cObject`,
where MRI seats every core class when it defines it (`rb_define_class("Hash", …)`,
`vendor/ruby/v3.3.11/hash.c`; `rb_define_class("Array", …)`,
`vendor/ruby/v3.3.11/array.c`). trails' table holds only what `registerConstant`
wrote, and no core class is in it: `variable.trails.test.ts` asserts
`rbPathToClass("Array")` raises `undefined class/module Array`.

`Marshal.load`'s `TYPE_UCLASS` arm (`vendor/ruby/v3.3.11/marshal.c:1935-1960`,
`rObjectFor` in `packages/ruby-compat/src/marshal.ts`) reads the class of a
`compare_by_identity` Hash as `path2class("Hash")` (`marshal.c:1937,1943-1948`),
which `w_object` writes at `marshal.c:1074-1077`. So a dump holding an identity
Hash loads only once a caller has run `registerConstant("Hash", Hash)`, which
`marshal.trails.test.ts` does in its `beforeAll`. `hash.ts` cannot seat itself:
`variable.ts` imports `object.ts` and `include.ts`, both of which import
`hash.ts`, so a module-scope `registerConstant` there reads `_constants` in TDZ
when `variable.ts` is the entry module.

## Acceptance criteria

- [ ] `rbPathToClass("Hash")` answers ruby-compat's `Hash` with no caller
      registration, and so does each other core class ruby-compat defines a
      seat for (`rbDefineClass` in `object.ts`, `Array`, `String`), surviving
      `resetConstants()`.
- [ ] `marshal.trails.test.ts` drops `Hash` from its registered `CONSTANTS`,
      and `Marshal.load`'s JSDoc drops the sentence about seating `Hash`.
- [ ] `variable.trails.test.ts`'s `rbPathToClass("Array")` case asserts the
      class, not the `ArgumentError`.
- [ ] A plain-node import of the built `dist/variable.js` and `dist/hash.js`
      as entry modules does not throw.
