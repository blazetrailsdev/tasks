---
title: "pg C extension scan credits pg_define_coder's encode/decode"
status: ready
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pg_define_coder` (`vendor/pg/v1.5.9/ext/pg_coder.c:466-479`) builds each coder class with `rb_define_class_under( nsp, name, base_klass )`. It then adds `encode` when `nsp` is `rb_mPG_TextEncoder` or `rb_mPG_BinaryEncoder`, and `decode` when `nsp` is a Decoder namespace, each with `rb_define_method( coder_klass, ...)` on a local. The trails#10504 C scan sees the classes only through their `/* dummy = rb_define_class_under(...) */` RDoc hints and never sees those methods. So `encode` / `decode` on `packages/pg/lib/text-decoder/*.ts`, `text-encoder/*.ts` and `simple-decoder.ts` still carry `@noRailsEquivalent PERMANENT` receipts, although pg defines them.

## Acceptance criteria

- [ ] The C scan credits `decode` to every class `pg_define_coder` registers under a Decoder namespace, and `encode` under an Encoder namespace, with the `-1` arity (`args` splat).
- [ ] The `@noRailsEquivalent` receipts on those `encode` / `decode` members are removed.
