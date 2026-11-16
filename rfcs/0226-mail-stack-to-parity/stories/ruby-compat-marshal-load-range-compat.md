---
title: "ruby-compat-marshal-load-range-compat"
status: ready
updated: 2026-11-16
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# ruby-compat Marshal.load reads a dumped Range (range_loader compat)

## Context

`Marshal.load` of `vendor/mail/2.8.1/lib/mail/values/unicode_tables.dat` (needed by
`mail-unicode-tables-dat-shipped`) fails in `packages/ruby-compat/lib/marshal.ts`:

- A Range is dumped through `rb_marshal_define_compat(rb_cRange, rb_cObject, range_dumper, range_loader)`
  (`vendor/ruby/v3.3.11/range.c:2179-2206,2640`) as a `TYPE_OBJECT` of class `Object`
  with hidden ivars `excl`, `begin`, `end` (no `@`). ruby-compat has no compat entry for `Range`.
- `rIvar` hands those names to `rbObjIvarSet`, which raises `NameError` "`excl' is not allowed as an instance variable name".
- `rbObjAlloc(Object)` answers a plain object, which `rbObjClass` reads as `Hash`, so
  `tObjectP` fails and `TYPE_OBJECT` raises "dump format error" (`marshal.ts`, the `TYPE_OBJECT` arm).
  The old class needs a non-Hash shape, as `Rational.compatible` (`rational.ts`) is for `nurat_loader`.

## Acceptance criteria

- [ ] `rangeDumper` / `rangeLoader` ported from `range.c:2179-2206`, registered with `rbMarshalDefineCompat`, and `Range` has an allocator.
- [ ] Hidden (non-`@`) ivars set by `r_ivar` are readable by a compat loader.
- [ ] `Marshal.load(Marshal.dump(new Range(1, 5, true)))` round-trips, and `Marshal.load` of mail's `unicode_tables.dat` succeeds.
