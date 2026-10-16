---
title: "TS extractor credits attrInternal on a moduleEval carrier"
status: draft
updated: 2026-10-16
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`attr_internal :default_form_builder` (`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb:122`)
is ported (trails#8962) as `attrInternal.call(m, "defaultFormBuilder")` inside
`FormHelper`'s `mod.moduleEval((m) => …)` in
`packages/actionview/src/helpers/form-helper.ts`. The same shape is used in
`packages/actionpack/src/action-controller/metal/instrumentation.ts:28`
(`attrInternal.call(carrier, "viewRuntime")`).

`scripts/api-compare/extract-ts-api.ts`'s `attributeMacro` / `attrMacro`
(around :3360-3390) know `classAttribute`, `mattr*`, `cattr*`, `attrReader` /
`attrWriter`. They do not know `attrInternal*`, and they do not resolve a
`moduleEval` callback parameter to the enclosing `new Module` binding. So
parity:api scores `default_form_builder` / `default_form_builder=` on
`form_helper.rb` as `declaration-only` (taken from `FormHelperHost`), and
the file row stays at 2 missing.

## Acceptance criteria

- The TS extractor credits `attrInternal` / `attrInternalReader` /
  `attrInternalWriter` / `attrInternalAccessor` as instance reader / writer
  (`x` and `x=`), including when called on the `moduleEval` carrier of a
  `new Module` bound to a module name.
- `form_helper.rb` scores 0 missing in `pnpm parity:api --package actionview`.
