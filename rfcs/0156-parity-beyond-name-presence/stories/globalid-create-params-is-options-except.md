---
title: "GlobalID.create params is options.except, no null-filter or String coercion"
status: draft
updated: 2026-10-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `GlobalID.create` is `params = options.except(:app, :verifier, :for)` then `new URI::GID.create(app, model, params), options` (`vendor/globalid/v1.3.0/lib/global_id/global_id.rb:11-19`). trails (`packages/globalid/src/global-id.ts`, `create`) also drops `null`-valued keys, `String()`-coerces each value, and passes `null` when nothing is left. None of those arms is in Rails. Value handling belongs to `URI::GID#set_params` / `build` (`uri/gid.rb`), so any coercion has to live there, not in `create`.

## Acceptance criteria

- `create` passes `except(opts, "app", "verifier", "for")` straight to `GID.create`, matching Rails.
- Any coercion that is still needed lives in the `URI::GID` port, where Rails does it.
- The globalid tests pass.
