---
title: "convertToModel / modelNameFromRecordOrClass not reachable from templates (FormHelper does not include ModelNaming)"
status: done
updated: 2026-09-30
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: 9
pr: trails#8266
claim: "2026-09-30T09:49:52Z"
assignee: "actionview-rendering-methods-have-no-super-chain"
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Helpers::FormHelper` includes `ModelNaming` beside `RecordIdentifier`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/form_helper.rb:119-120`), so
`convert_to_model` / `model_name_from_record_or_class`
(`vendor/rails/v8.0.2/actionview/lib/action_view/model_naming.rb:6-12`) are public
instance methods on every view.

trails#8225 converged the `RecordIdentifier` half: `packages/actionview/src/helpers/form-helper.ts`
re-exports `domClass` / `domId`, and `helpers/index.ts`'s `export * from "./form-helper.js"`
seats them on `Base.prototype` (`base.ts:377-381`). `form-helper.ts` only _imports_
`convertToModel` / `modelNameFromRecordOrClass` from `../model-naming.js`, so neither is
reachable from a template (`<%= convertToModel(post) %>` raises `convertToModel is not defined`).

## Converged shape

`form-helper.ts` re-exports both, mirroring `include ModelNaming`:

```ts
export { convertToModel, modelNameFromRecordOrClass } from "../model-naming.js";
```

## Acceptance criteria

- `convertToModel` / `modelNameFromRecordOrClass` reach the view through `FormHelper`.
- A view test (beside `template/form-helper.trails.test.ts`) renders both from a template.
- `parity:api:extra:gate` stays green.
