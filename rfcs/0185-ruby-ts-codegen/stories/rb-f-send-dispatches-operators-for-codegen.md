---
title: "rbFSend dispatches Ruby operators and << on untyped receivers"
status: ready
updated: 2026-10-17
rfc: "0185-ruby-ts-codegen"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

For a Ruby binary operator or `<<` on a receiver whose type it cannot infer, the codegen generator emits two generated-runtime shim helpers (`scripts/codegen/src/runtime-shim.ts`):

- `rbBinop(a, op, b)`, which handles `+ - & | <=> < > <= >=` over an Array, a Set, a number or a Comparable (81 uses in generated activerecord, 15 in activejob);
- `rbAppend(a, b)`, which handles `<<` (50 and 8 uses).

The repo owner ruled that no generated runtime ships. A typed receiver gets the native operator, `push` or `+=`. An untyped receiver needs Ruby dispatch, which is the job of ruby-compat's `rbFSend` (`Kernel#send`) and its method tables (`ARRAY_METHOD_TABLE`, `OBJECT_METHOD_TABLE`).

The Ruby targets are:

- `Array#+ - & |` (`array.c` `rb_ary_plus`, `rb_ary_diff`, `rb_ary_and`, `rb_ary_or`);
- `Array#<<`, which is `rb_ary_push` (`vendor/ruby/v3.3.11/array.c:1338`);
- `String#<<`, which is `rb_str_concat` (`string.c:3511`); a JS string is immutable, so the generator reassigns;
- `Set#<<`, `Set#+` and `Set#-` (`vendor/ruby/v3.3.11/lib/set.rb`);
- `Comparable` (`compar.c`), through ruby-compat's `cmp`.

## Acceptance criteria

- [ ] `rbFSend` dispatches `+ - & | << <=> < > <= >=` on an Array, a Set, a String and a number by their Ruby names, through ruby-compat's method tables, with MRI citations and a test per receiver kind.
- [ ] The generator emits the native operator for a typed receiver and `rbFSend(a, op, b)` for an untyped one. `rbBinop` and `rbAppend` are deleted from `runtime-shim.ts`.
