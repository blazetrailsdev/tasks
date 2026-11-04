---
title: "Preview filename/content_type reach presentation and process the variant"
status: done
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9712
claim: "2026-11-04T15:26:29Z"
assignee: "preview-delegated-reads-reach-presentation"
blocked-by: null
closed-reason: null
---

## Context

`ActiveStorage::Preview` delegates `filename` / `content_type` to `presentation` (`vendor/rails/v8.0.2/activestorage/app/models/active_storage/preview.rb:36`, `:127-129`), which runs `variant.processed` in line. trails' sync getters (`packages/activestorage/src/preview.ts`, trails#9696) read `variant? ? variant : image` without `processed`, and raise `RuntimeError` when the preview image's blob is unloaded, because `Variant#processed` is async.

## Acceptance criteria

- The getters reach `presentation` (and so `processed`) as Rails does, or the sync-read limit is ratified in CLAUDE.md and the receipts become `PERMANENT`.
- The `@missingRailsCall processed` / `@inventedArm` receipts on `Preview#filename` / `#contentType` are removed.
