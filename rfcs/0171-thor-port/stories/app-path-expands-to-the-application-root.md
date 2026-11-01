---
title: "app-path-expands-to-the-application-root"
status: draft
updated: 2026-11-01
rfc: "0171-thor-port"
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

`packages/trailties/src/bin.ts:14` can set `APP_PATH` to `dist/config/application.js`, so `applicationRoot` in `command.ts` strips that build directory, which `vendor/rails/v8.0.2/railties/lib/rails/command.rb:110-112` has no need to do.

## Acceptance criteria

- [ ] `APP_PATH` resolves so that `../..` is the application root, and the strip and its `@inventedArm replace` receipt are removed.
