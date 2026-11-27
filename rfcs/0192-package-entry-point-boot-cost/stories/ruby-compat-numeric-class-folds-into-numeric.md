---
title: "ruby-compat: fold numeric-class.ts into numeric.ts by breaking numeric.ts's load cycle"
status: draft
updated: 2026-11-27
rfc: "0192-package-entry-point-boot-cost"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10838 put `rbCNumeric` / `rbCInteger` / `rbCFloat` and `rbDefineClass` in a new `packages/ruby-compat/lib/numeric-class.ts`. MRI defines them in `numeric.c` (`vendor/ruby/v3.3.11/numeric.c:6156,6190,6259`, `Init_Numeric`), and trails' counterpart is `numeric.ts`. They sit in a separate file only because `numeric.ts` is in the cycle `object.ts` → `enumerable.ts` → `rational.ts` → `numeric.ts` (`numeric.ts` imports `complex.js`, `rational.js` and `object.js`), so its body can run after `rational.ts` reads `rbCNumeric` in an `extends`.

The same PR moved `rbModDefineMethod`, `rbSeatSuper` and `superSlots` / `superSlotFor` / `_superSlot` out of `object.ts` into the leaf `method-cache.ts`. vite-node's SSR transform cannot call into `object.ts` mid-cycle. MRI's `rb_mod_define_method` is in `proc.c:2325`.

## Acceptance criteria

- [ ] `numeric.ts`'s load-time imports no longer reach back into `rational.ts` / `complex.ts` / `big-decimal.ts`; any read that still needs them runs at call time.
- [ ] The class seats in `numeric-class.ts` fold into `numeric.ts`, and `numeric-class.ts` is deleted.
- [ ] `scripts/ruby-compat-entry-modules.test.ts` and `scripts/package-size/side-effects.test.ts` stay green.
