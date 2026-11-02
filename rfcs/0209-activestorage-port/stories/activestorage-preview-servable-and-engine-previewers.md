---
title: "activestorage-preview-servable-and-engine-previewers"
status: ready
updated: 2026-11-02
rfc: "0209-activestorage-port"
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

`ActiveStorage::Preview` includes `Blob::Servable` and delegates `content_type` to `presentation`
(`vendor/rails/v8.0.2/activestorage/app/models/active_storage/preview.rb:36,39,127-129`).
`presentation` is `variant.processed` there, which is async here, so `Preview#contentType` in
`packages/activestorage/src/preview.ts` answers a promise, while `contentTypeForServing` and
`forcedDispositionForServing` in `packages/activestorage/src/blob/servable.ts` read `this.contentType`
synchronously. On a `Preview` they therefore compare a promise. The engine also does not assign
`ActiveStorage.previewers` from `config.active_storage.previewers`
(`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb:29,90`); only the test setup does,
as with `analyzers`.

## Acceptance criteria

- `contentTypeForServing` and `forcedDispositionForServing` answer correctly on a processed `Preview`, with a test.
- `packages/activestorage/src/engine.ts` assigns `previewers` and its default list as `engine.rb` does.
