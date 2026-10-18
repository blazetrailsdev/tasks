---
title: "Credit FormHelper's attr_internal :default_form_builder in parity:api"
status: ready
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api --package actionview --missing` still lists `helpers/form_helper.rb` as missing
`default_form_builder` / `default_form_builder=` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb:122`,
`attr_internal :default_form_builder`). The reader is ported: `packages/actionview/src/helpers/form-helper.ts` runs
`attrInternal.call(m, "defaultFormBuilder")` inside `FormHelper`'s `new Module((mod) => mod.moduleEval((m) => ...))`
block, and `defaultFormBuilderClass` reads it. `ts-extractor-credits-attr-internal-in-module-eval` (done) did not cover
this shape, so the extractor does not credit it. Found by the helpers final sweep
(`actionview-helpers-umbrella-eager-load-and-final-sweep`); the only other non-zero `helpers/**` row is
`date_helper.rb`'s `sec`..`year`, owned by `date-time-selector-generated-readers-credited`.

## Acceptance criteria

- [ ] `parity:api` credits `default_form_builder` / `default_form_builder=` on `helpers/form_helper.rb`, so the row shows
      0 missing.
