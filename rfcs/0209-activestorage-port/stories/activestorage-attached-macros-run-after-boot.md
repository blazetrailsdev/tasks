---
title: "activestorage-attached-macros-run-after-boot"
status: done
updated: 2026-10-31
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9550
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activestorage/src/variant-record.ts` runs `has_one_attached :image`
(`vendor/rails/v8.0.2/activestorage/app/models/active_storage/variant_record.rb:5`) at import, because
`index.ts` loads it, while Rails autoloads the model after boot. So it spells the macro
`ClassMethods.hasOneAttached.call(this, "image")`, since `Model` is included on `Base` only by the engine initializer,
and `validateGlobalServiceConfiguration` in `attached/model.ts` carries a `trails?.configuration != null` guard
that `attached/model.rb:275` does not have. That guard skips the "Missing Active Storage service name" raise before boot.

## Acceptance criteria

- `VariantRecord` calls `this.hasOneAttached("image")`.
- `validateGlobalServiceConfiguration` has no configuration guard.
