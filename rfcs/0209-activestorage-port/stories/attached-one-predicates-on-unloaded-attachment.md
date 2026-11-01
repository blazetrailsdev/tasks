---
title: "attached-one-predicates-on-unloaded-attachment"
status: done
updated: 2026-11-01
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9560
claim: "2026-11-01T01:54:44Z"
assignee: "testtask-direct-loader-libs-reach-load-path"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/attached/one.rb:32-34,44-46,73-75`: `attachment`, `blank?` and `attached?` are sync because the association lazily loads. In `packages/activestorage/src/attached/one.ts`, `isAttached` and `isBlank` are async, so activesupport's `isBlank(one)` receives a promise, and `delegate_missing_to` answers `undefined` until the attachment has loaded.

## Acceptance criteria

- `isBlank(user.avatar)` gives a correct answer for loaded and unloaded attachments, or the shape is ruled on by the repo owner.
- Delegated reads do not silently read `undefined` on an unloaded attachment.
