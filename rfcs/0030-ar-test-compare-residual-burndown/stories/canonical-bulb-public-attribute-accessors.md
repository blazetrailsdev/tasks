---
title: "canonical-bulb-public-attribute-accessors"
status: claimed
updated: 2026-06-19
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-19T11:48:25Z"
assignee: "canonical-bulb-public-attribute-accessors"
blocked-by: null
---

## Context

The canonical `Bulb` model
(`packages/activerecord/src/test-helpers/models/bulb.ts`) calls
`this.readAttribute(...)` (after_create) and `this.writeAttribute(...)`
(`color=` setter). `Base` only assigns the underscore-prefixed
`_readAttribute`/`_writeAttribute`; the public `readAttribute`/`writeAttribute`
aliases are `declare`d (base.ts:3365) but never bound, so creating any canonical
`Bulb` throws `this.readAttribute is not a function`.

Surfaced while un-skipping `association keys bypass attribute protection` in
`packages/activerecord/src/associations/has-one-associations.test.ts`
(RFC 0030 story a3-has-one-and-through), which uses canonical Car/Bulb. That test
is left `it.skip` with a BLOCKED/ROOT-CAUSE tag pending this fix.

Rails exposes `read_attribute`/`write_attribute` as public instance methods.

## Acceptance criteria

- [ ] `Base` exposes public `readAttribute`/`writeAttribute` (bound to the same
      logic as `_readAttribute`/`_writeAttribute`), matching Rails.
- [ ] Un-skip `association keys bypass attribute protection` (canonical Car/Bulb) and
      it passes: build/create with a `car_id` override still pins the owner FK.
- [ ] No regressions in models that already call the underscore forms.
