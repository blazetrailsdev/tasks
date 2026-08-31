---
title: "vendor-ruby-spec-subset"
status: closed
updated: 2026-08-31
rfc: "0089-corelib-primitives"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: 2
pr: 6130
claim: "2026-08-05T15:21:04Z"
assignee: "datetime-new-start-preserves-the-receiver"
blocked-by: null
closed-reason: "superseded by 0129-ruby-compat/vendor-ruby-mri-source + ruby-spec-behavioural-enrollment"
---

## Context

Two members of the corelib population cannot anchor to portable source, only to
**behavior**:

- `packages/activesupport/src/include.ts` (239 lines) — header says _"Mirrors:
  Ruby's Module#include (core language feature)"_ (`include.ts:10`).
- `packages/activesupport/src/prepend.ts` (117 lines) — _"Mirrors: Ruby's
  `Module#prepend`"_ (`prepend.ts:12-15`).

`Module#include`/`#prepend` live in `eval.c`/`class.c` as interpreter internals.
There is nothing to mirror method-by-method. `ruby/spec` is their only anchor.

Two more members anchor to Ruby C source that likewise is not portable, but whose
_behavior_ `ruby/spec` covers precisely:

- `packages/activesupport/src/range-ext.ts:65-100` — ports `range.c`
  `range_include_internal` / `str_upto_each`.
- `packages/activesupport/src/core-ext/string/succ.ts` — ports `string.c`
  `rb_str_succ`.

**This is a different anchoring contract from the `date` gem's** and the RFC is
explicit that the two must not be conflated: this source enrolls in
`parity:test` **only**, never `parity:api`.

## Acceptance criteria

- [ ] `vendor/sources.ts` gains a `ruby_spec` source (`https://github.com/ruby/spec.git`)
      pinned to a **dated SHA**, not a moving branch.
- [ ] Scoped to `core/module`, `core/range`, `core/string` — not the whole spec
      suite.
- [ ] `compareApi: false` **permanently**, with a comment stating why (interpreter
      internals; behavior-only anchor). This is not a flag a later story flips.
- [ ] `compareTests: false` initially; flipped by `corelib-test-compare-enrollment`.
- [ ] `pnpm vendor:fetch` populates `vendor/ruby_spec/`.
- [ ] `vendor/sources.lock.json` and `vendor/sources.test.ts` updated/passing.
