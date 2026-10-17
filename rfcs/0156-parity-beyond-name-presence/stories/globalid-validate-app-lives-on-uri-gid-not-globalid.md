---
title: "GlobalID.validateApp is invented; validate_app lives on URI::GID"
status: draft
updated: 2026-10-17
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/globalid/src/global-id.ts` defines `static validateApp(app)` on `GlobalID`, forwarding to `GID.validateApp`. Rails' `GlobalID` has no `validate_app`; it lives only on `URI::GID` (`vendor/globalid/v1.3.0/lib/global_id/uri/gid.rb:50-55`). Callers on the Rails side reach it through `URI::GID.validate_app` (`global_id.rb:34`, `railtie.rb`).

## Acceptance criteria

- `GlobalID.validateApp` is removed; every caller uses `GID.validateApp` (the `URI::GID` port).
- parity:api:extra for globalid shrinks by one; tighten the mark.
