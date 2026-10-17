---
title: "ruby-compat ports Kernel#raise and rb_make_exception for generated code"
status: draft
updated: 2026-10-17
rfc: "0185-ruby-ts-codegen"
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

The codegen generator (`scripts/codegen`, RFC 0185) lowers Ruby `raise` through a generated-runtime shim, `rbRaise` and `rbMakeException` in `scripts/codegen/src/runtime-shim.ts`. The repo owner ruled that no generated runtime ships. Real Ruby semantics JS cannot express belong in ruby-compat, and anything JS expresses natively is emitted natively.

`Kernel#raise` is `rb_f_raise` (`vendor/ruby/v3.3.11/eval.c:736`), which builds its exception with `rb_make_exception` (`eval.c:833`):

- a String raises `RuntimeError` with that message;
- an object answering `exception` is asked for one (`Exception.exception` is `rb_class_new_instance`);
- a bare `raise` re-raises `$!`, else raises `RuntimeError` "unhandled exception".

The shim already implements these arms. Its `SHIM_SOURCES` entry cites them arm by arm.

## Acceptance criteria

- [ ] ruby-compat exports the `Kernel#raise` / `rb_make_exception` port, at MRI's names per ruby-compat's naming rule, with `vendor/ruby/v3.3.11/eval.c` citations and tests for each arm.
- [ ] The generator emits the ruby-compat call; `rbRaise` and `rbMakeException` are deleted from `runtime-shim.ts`.
- [ ] Where the raised value is a literal exception class, the generator emits a native `throw new X(...)` instead (RFC 0194, native-first).
