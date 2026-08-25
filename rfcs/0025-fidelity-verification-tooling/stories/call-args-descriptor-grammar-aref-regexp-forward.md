---
title: "call-arg descriptors: cover aref, regexp and ... instead of falling through to ?"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
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
closed-reason: "Superseded by complete-call-arg-descriptor-grammar-both-sides (2026-08-17 sweep): merged with call-args-braced-hash-kwargs-split-pinned-both-sides because the extractor-skew vocabulary pin forces any descriptor change onto both extractors in one PR. Citations carried forward."
---

## Context

`extract-ruby-api.rb#describe_arg` (landed in #6298) implements the RFC 0025
`## Call-argument fidelity` §1 descriptor table. Four Ripper node kinds are not
in that table and therefore fall through to the bare `?` descriptor, which makes
the **whole call site** opaque and skipped by the comparator (§2: "any argument
list containing an opaque descriptor" is ignored).

Measured over `vendor/rails/activerecord/lib` at merge time — 13,730 call sites,
239 bare `?` argument positions, distributed as:

| Ripper node       | count | source form      |
| ----------------- | ----: | ---------------- |
| `:aref`           |   182 | `h[:k]`, `xs[0]` |
| `:regexp_literal` |   130 | `/\A[a-z]/`      |
| `:string_concat`  |    25 | `"a" "b"`        |
| `:args_forward`   |    24 | `...`            |

`:aref` and `:regexp_literal` together are ~90% of the loss and both are
mechanically describable:

- `:aref` → `aref:<receiver-desc>` or simply `aref`, mirroring what the TS side
  sees for `ElementAccessExpression`. Even the coarse form recovers the site,
  because the comparator only needs the two sides to agree.
- `:regexp_literal` → `re:<source>` when the pattern has no interpolation,
  `str-interp`-style opaque when it does. TS `RegularExpressionLiteral` gives
  the same text, so the two sides can compare byte-for-byte.
- `:args_forward` (`...`) is arity-unknown by construction, which is exactly
  what the existing `splat` flag means — it should set that flag rather than
  land as a bare `?`.

Any new descriptor has to be added on **both** sides in one change, or the
`extractor-skew` vocabulary pin (`ts-extractor-emit-call-arguments` AC4) reds.
Extending the grammar also means extending the RFC's §1 table, which is the
spec the two extractors are written against.

## Acceptance criteria

1. RFC 0025 §1's table gains rows for `aref`, `re:` and the `...` → `splat`
   flag mapping.
2. `extract-ruby-api.rb#describe_arg` and the TS `collectCalls` argument walker
   emit the new descriptors, identically spelled.
3. The `extractor-skew` vocabulary pin covers the new descriptors.
4. Bare `?` argument positions in activerecord drop from 239 to under 60
   (measure the same way: count `?` descriptors over `callArgs`).
5. `calls` / `weakCalls` / `skeleton` stay byte-identical on both sides.
