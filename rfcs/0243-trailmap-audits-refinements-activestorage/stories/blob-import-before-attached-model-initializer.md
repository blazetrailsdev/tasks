---
title: "blob-import-before-attached-model-initializer"
status: claimed
updated: 2026-11-20
rfc: "0243-trailmap-audits-refinements-activestorage"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-20T00:10:36Z"
assignee: "audit-report-skill-posts-to-trailmap"
blocked-by: null
closed-reason: null
---

## Context

trailmap#174 found the bug. When an app statically imports `@blazetrails/activestorage/blob` from a file that a config initializer loads, boot fails with `TypeError: base.hasOneAttached is not a function`. The throw is at `blob/representable.ts`'s `included` hook (`base.hasOneAttached("previewImage")`), reached from `include(Blob, Representable)` at `packages/activestorage/lib/blob.ts:577`. That `include` runs at module evaluation. The `active_storage.attached` initializer, which runs `onLoad("active_record", … include(this, Model))` (`packages/activestorage/lib/engine.ts:207-208`), has not run yet at that point.

Rails has no such hazard. `ActiveStorage::Blob` is autoloaded on first reference, after `engine.rb`'s `initializer "active_storage.attached"` has run `ActiveSupport.on_load(:active_record) { include ActiveStorage::Attached::Model }` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb`). `ActiveStorage::Record < ActiveRecord::Base` (`app/models/active_storage/record.rb`), and `Base` runs its `on_load(:active_record)` hooks when it is defined.

trailmap's work-around is in `test/models/active-storage.test.ts`. It warms the Blob and Attachment schemas in the test, because `lib/model-schemas.ts` cannot import them.

## Acceptance criteria

- [ ] An app module evaluated during initializers can import `Blob` / `Attachment` from `@blazetrails/activestorage` without throwing. The `Attached::Model` include reaches `Base` before `Representable`'s `included` hook calls `hasOneAttached`, as Rails' `on_load(:active_record)` order gives.
- [ ] Add a regression test that imports `blob.ts` before the engine's initializers run, and verify that it fails on main.
