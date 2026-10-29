---
title: "Port SolidCable Listener's self-pipe members over a ruby-compat IO.pipe"
status: draft
updated: 2026-10-29
rfc: "0196-solid-stack"
cluster: null
packages: []
deps:
  - ruby-compat-io-pipe
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

`ActionCable::SubscriptionAdapter::SolidCable::Listener`'s private `wake_up`,
`interrupt`, `SELF_PIPE_BLOCK_SIZE`, `interruptible_sleep`, `self_pipe` and
`create_self_pipe` (`vendor/solid_cable/v3.0.7/lib/action_cable/subscription_adapter/solid_cable.rb:131-163`)
are not ported in `packages/solid-cable/src/action-cable/subscription-adapter/solid-cable.ts`.
They build a self-pipe from `IO.pipe` and read it with `wait_readable` / `read_nonblock`;
ruby-compat's `IO` (`packages/ruby-compat/src/io.ts`) has no `pipe`. Nothing in the gem calls
`wake_up` or `interruptible_sleep`.

## Acceptance criteria

- ruby-compat `IO.pipe` exists (or is ported by its own story, added as a dep).
- The six members are ported on `Listener` at their Rails names over it.
