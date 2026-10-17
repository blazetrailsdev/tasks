---
title: "Port ActionCable::SubscriptionAdapter::SolidCable and its message model"
status: draft
updated: 2026-10-17
rfc: "0000-solid-stack"
cluster: solid-stack
packages: ["solid-cable"]
deps:
  [
    "vendor-solid-cache-queue-cable-gems",
    "port-actioncable-subscriber-map-base-adapter-and-channel-prefix",
  ]
deps-rfc: []
est-loc: 500
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_cable/v3.0.7/lib/action_cable/subscription_adapter/solid_cable.rb`
subclasses `SubscriptionAdapter::Base` and polls `SolidCable::Message`
(`app/models/solid_cable/message.rb`) through a `Listener` thread. RFC 0177
ports the base adapter and the subscriber map
(`port-actioncable-subscriber-map-base-adapter-and-channel-prefix`). The
Redis adapter is in the unported register.

## Acceptance criteria

- `packages/solid-cable` exists (same skeleton shape as solid-cache), with the
  adapter, the `Message` model and the trim job ported at their Rails names.
  The listener's polling loop is an async timer.
- The gem's adapter tests run on all three AR adapters, through
  actioncable's shared `common.rb` behaviors once RFC 0177 ports them.
- The solid_cable source turns on compare.
