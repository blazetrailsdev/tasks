---
title: "VariantRecord and Blob::Representable call has_one_attached directly"
status: claimed
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: [activestorage]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-11-04T14:38:14Z"
assignee: "active-storage-models-call-has-one-attached-directly"
blocked-by: null
closed-reason: null
---

## Context

Rails calls `has_one_attached :image` directly in `VariantRecord`'s class body (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/variant_record.rb:5`) and `has_one_attached :preview_image` in `Blob::Representable`'s `included` block (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/blob/representable.rb:12`). That works because Zeitwerk loads those models after the engine's `active_storage.reflection` initializer has included `ActiveStorage::Attached::Model` / `ActiveRecordExtensions` into `ActiveRecord::Base` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb`).

trails' `packages/activestorage/src/variant-record.ts:16` and `blob/representable.ts:138` wrap the call in `onLoad("active_storage_reflection", …)`. The module can evaluate before `engine.ts`'s initializer includes the extensions into `Base`, and a direct call raises `TypeError: this.hasOneAttached is not a function` (checked on trails#9690).

## Acceptance criteria

- `ActiveRecordExtensions` / `Attached::Model` are on `Base` before `variant-record.ts` and `blob.ts` evaluate. For example, the models load through the application's autoloader after initializers, as Zeitwerk does in Rails.
- `VariantRecord` and `Representable` call `hasOneAttached` directly, and the `@inventedArm onLoad` receipts are deleted.
- `engine.trails.test.ts`'s late-evaluation test still passes.
