---
title: "solid-cable-record-connects-to-at-load"
status: done
updated: 2026-10-29
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9459
claim: "2026-10-29T22:08:36Z"
assignee: "ruby-compat-io-pipe"
blocked-by: null
closed-reason: null
---

## Context

`SolidCable::Record` runs `connects_to(**SolidCable.connects_to) if SolidCable.connects_to.present?`
in its class body (`vendor/solid_cable/v3.0.7/app/models/solid_cable/record.rb:7`). trails imports
`packages/solid-cable/src/record.ts` eagerly, before the engine's `solid_cable.config` initializer has
loaded `config_for("cable")`, so the call is omitted under `@missingRailsCall connectsTo`.

## Acceptance criteria

- `Record` calls `connectsTo(SolidCable.connectsTo())` when it is present, once the cable config is
  loaded (e.g. through an `onLoad` hook as solid-queue's engine does for `solid_queue_record`).
- The `@missingRailsCall connectsTo` receipt on `Record` is removed.
