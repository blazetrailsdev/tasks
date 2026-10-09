---
title: "parity: call-args comparer files a kwarg-nested owner.class / owner.constructor pair as a shape row"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8731
claim: "2026-10-09T22:33:23Z"
assignee: "call-args-comparer-classes-kwarg-nested-class-ref-as-shape"
blocked-by: null
closed-reason: null
---

## Context

`Association#find_target`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/association.rb:249-251`) calls
`Base.strict_loading_violation!(owner: owner.class, reflection: reflection)`. The port in
`packages/activerecord/src/associations/association.ts` passes
`{ owner: this.owner.constructor, reflection: this.reflection }`, which is the spelling
`NO_JS_EQUIVALENT` (`scripts/api-compare/naming-taxonomy.ts`, `class: ["constructor"]`) names for
Ruby's `.class`.

`pnpm parity:api:calls:args` still files it as a `shape` row:
`kwargs{owner=ref:class,reflection=ref:reflection}` against
`kwargs{owner=ref:constructor,reflection=ref:reflection}`. Two things in
`scripts/api-compare/call-args.ts` combine:

- `refKeysEqual` does not read `NO_JS_EQUIVALENT`, so `ref:class` and `ref:constructor` are not
  equal. `rbObjClass(this.owner)` is recorded as `ref:jsObjClass` and is not equal either.
- `classify` returns `naming` only when both top-level arguments start with `ref:`. A pair of
  `kwargs{…}` descriptors that differ in one ref-valued entry falls to `shape`, the gated class.

The call site carries `@missingRailsArgs strict_loading_violation! — CONVERGEABLE` pointing here.

## Acceptance criteria

- [ ] A kwarg value that differs only by a `ref:` spelling is classed as its positional twin would
      be, and `ref:class` against `ref:constructor` compares equal (or the faithful TS spelling of
      `owner.class` is decided and the call site uses it).
- [ ] The `@missingRailsArgs strict_loading_violation!` receipt on `Association#findTarget` is
      deleted and `pnpm parity:api:calls:args` is green.
