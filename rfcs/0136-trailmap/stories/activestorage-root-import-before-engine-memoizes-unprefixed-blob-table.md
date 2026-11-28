---
title: "Importing the activestorage root before the engine memoizes Blob.tableName without the active_storage_ prefix"
status: draft
updated: 2026-11-28
rfc: "0136-trailmap"
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

Since trails#10863, `packages/activestorage/lib/index.ts` evaluates `Blob` and `VariantRecord` whenever the package root is imported. `VariantRecord`'s class body calls `hasOneAttached("image")`, which runs `validateGlobalServiceConfiguration` (`packages/activestorage/lib/attached/model.ts:261`; Rails `vendor/rails/v8.0.5.2/activestorage/lib/active_storage/attached/model.rb:272`). In a process that is already connected, that reads `ActiveStorage.Blob.tableName`. If `ActiveStorage::Engine` has not yet run `isolateNamespace(ActiveStorage)` (`packages/activestorage/lib/engine.ts:98`; `vendor/rails/v8.0.5.2/railties/lib/rails/engine.rb:398-403`), the name memoizes as `blobs` rather than `active_storage_blobs`. Every later blob write then raises `can't write unknown attribute 'key'`.

Rails never hits this: models are autoloaded from `app/models` after the engine is loaded. trails#10870 fixed the actiontext test files by importing the root after the environment, but any consumer that imports the root before the engine (trailmap, for one) can still hit it.

## Acceptance criteria

- The package root can be imported before the engine in a connected process, and `ActiveStorage::Blob.tableName` still answers `active_storage_blobs`. Possible fixes: the root does not evaluate the models ahead of the engine, or the namespace prefix is seated before any model body runs.
- A regression test does this import order under plain node and fails on the current main.
