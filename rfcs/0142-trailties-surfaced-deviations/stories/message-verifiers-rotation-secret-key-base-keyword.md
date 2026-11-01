---
title: Call gates read a block through Object.assign at new MessageVerifiers
status: ready
updated: 2026-11-01
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: [trailties]
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

`Application#message_verifiers` is `ActiveSupport::MessageVerifiers.new do ... end.rotate_defaults`
(`vendor/rails/v8.0.2/railties/lib/rails/application.rb:208-213`), and
`RotationCoordinator` reads the block's keywords from `parameters`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/messages/rotation_coordinator.rb:67-69`).
trails#9563 seats that stand-in with `Object.assign` around the block in
`packages/trailties/src/application.ts`. Rotation works, but the call gates
read a block only as `new`'s direct argument, so the wrapper produced a
`call-mismatches-exclude/trailties/application.json` row
`order:keyGenerator,constructor` and a `@missingRailsArgs new` receipt.

## Acceptance criteria

- The call gates read a block through `Object.assign` at a `new` call, or
  `parameters` is seated another way that leaves the block a direct argument.
- The `order:keyGenerator,constructor` row and the `@missingRailsArgs new`
  receipt on `messageVerifiers` are deleted.
