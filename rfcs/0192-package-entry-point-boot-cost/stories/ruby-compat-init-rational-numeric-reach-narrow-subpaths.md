---
title: "ruby-compat: Init_Rational/Init_Numeric work in include.ts reaches narrow-subpath entries"
status: draft
updated: 2026-11-25
rfc: "0192-package-entry-point-boot-cost"
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

trails#10719 seated `Enumerable` and `Rational`'s class paths in `enumerable.ts` / `rational.ts`, where MRI defines them. `packages/ruby-compat/lib/include.ts` (tail of the file) still holds the rest of MRI's `Init_Rational` / `Init_Numeric` work:

- `rbDefineAllocFunc(Rational, …)` (`vendor/ruby/v3.3.11/rational.c:2759`ff, `rb_define_alloc_func`)
- `Object.setPrototypeOf(Rational|Complex|BigDecimal, rbCNumeric)` (`rb_define_class("Rational", rb_cNumeric)`, `rational.c:2759`)
- `rbModDefineMethod(rbCInteger, "toR")` (`rational.c:2148`), `Integer#toInt` (`numeric.rb:255`), `Float#toR` (`rational.c:2199`), `Float#toInt` (`numeric.c:2597`)

A consumer entering through a narrow subpath that never evaluates `include.js` (e.g. `/object` only) sees `rbFSend(1, "toR")` miss and `Rational`'s superclass as `Object`. Moving these into `rational.ts` / `numeric.ts` directly hits a TDZ: `enumerable.js` imports `rational.js` before `object.js` finishes, so `rbCNumeric` is uninitialised at `rational.ts` eval.

## Acceptance criteria

- [ ] Each definition sits at the module that defines its class (converged as MRI's `Init_*` order guarantees), or every module reading them loads `include.js`.
- [ ] A plain-node test (alongside `scripts/ruby-compat-entry-modules.test.ts`) imports each `dist/**/*.js` entry alone and asserts `Integer#toR` and `Rational`'s Numeric parent are in place without loading `include.js` afterwards.
- [ ] `scripts/ruby-compat-entry-modules.test.ts` stays green.
