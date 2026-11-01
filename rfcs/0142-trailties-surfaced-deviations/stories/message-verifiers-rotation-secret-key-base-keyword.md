---
title: "message-verifiers-rotation-secret-key-base-keyword"
status: draft
updated: 2026-11-01
rfc: "0142-trailties-surfaced-deviations"
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

`Application#message_verifiers` passes a block taking `secret_key_base:`
(`vendor/rails/v8.0.2/railties/lib/rails/application.rb:208-213`), and
`RotationCoordinator` reads its keywords from `secret_generator.parameters`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/messages/rotation_coordinator.rb:67`).
`packages/activesupport/src/messages/rotation-coordinator.ts:110` reads a
`parameters` property a JS arrow function does not have, so
`messageVerifiers().rotate({ secretKeyBase })` in
`packages/trailties/src/application.ts` does not reach the generator.

## Acceptance criteria

- A rotation with `secretKeyBase` reaches the block's keyword.
- The block stays the direct argument of `new MessageVerifiers`.
