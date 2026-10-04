---
title: "ruby-compat: SystemCallError instanceof reads an errno table; Enumerator#isAll takes a pattern"
status: draft
updated: 2026-10-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Raised in review of trails#8491, which gave ruby-compat's `SystemCallError`
(`packages/ruby-compat/src/errno.ts`) a `Symbol.hasInstance` so
`SQLite3Adapter#initialize` could port `rescue SystemCallError`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:117-121`)
as an `instanceof` guard, and added `Enumerator#isAll` (`packages/ruby-compat/src/enumerator.ts`).

Two gaps against Ruby remain:

- `SystemCallError` (`vendor/ruby/v3.3.11/error.c:3380`) is the parent of the `Errno` classes that
  `set_syserr` defines from the platform's errno table (`error.c:2700-2737`). The port answers
  `instanceof` for any `Error` whose `.code` matches `/^E[A-Z0-9]+$/`, so an unrelated error carrying
  an invented code such as `EBOGUS` is classified as a system-call error. Converged shape: membership
  in the errno names the fs backend can raise, held as a table beside `Errno`, with
  `file-utils.ts#isSystemCallError` reading the same table.
- `Enumerable#all?` (`vendor/ruby/v3.3.11/enum.c:1737-1804`) has three arms: a block, a pattern
  tested with `===`, and neither (the elements' own truthiness). `Enumerator#isAll` ports the block
  arm only. `attribute_assignment.rb:45` calls the pattern arm, `each_value.all?(NilClass)`, which
  `attribute-assignment.ts` spells as a block.

## Acceptance criteria

- [ ] `instanceof SystemCallError` is true only for an error carrying a real errno name, with a test for an invented `E…` code.
- [ ] `Enumerator#isAll` takes a pattern or no argument as `enum_all` does, and `attribute-assignment.ts` passes the pattern.
