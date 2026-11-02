---
title: "Run Representable's and VariantRecord's attachment macros as Rails does"
status: draft
updated: 2026-11-02
rfc: "0209-activestorage-port"
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

Rails runs `has_one_attached :preview_image` in `Blob::Representable`'s `included do` (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/blob/representable.rb:12`) and autoloads `ActiveStorage::VariantRecord` (`variant_record.rb:5`), both after boot. `config.active_storage` exists from `engine.rb:28`, and `validate_global_service_configuration` (`attached/model.rb:274-278`) checks `ActiveStorage::Blob.table_exists?`.

In trails `Blob` loads with the package, so `packages/activestorage/src/engine.ts` runs the macro and imports `variant-record.js` at boot, behind `"hasOneAttached" in Blob` and `reflectOnAssociation` guards. It also passes `service: () => null` there and in `variant-record.ts:16`, to skip that validation, because the engine does not set `config.activeStorage`, and `model.ts:257` drops `table_exists?`. When the guard is false, `VariantRecord` is not loaded.

## Acceptance criteria

- The engine sets `config.activeStorage`, and `validateGlobalServiceConfiguration` carries Rails' `table_exists?` check.
- `hasOneAttached("previewImage")` and `hasOneAttached("image")` take no `service` argument.
- `has_one_attached :preview_image` runs from `Representable`'s `included` hook, or the macro is available to `Blob` when it loads.
- `VariantRecord` resolves whenever `Blob` does, and the engine has no guard arms.
