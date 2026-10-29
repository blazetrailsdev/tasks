---
title: "Port ActionCable::SubscriptionAdapter::SolidCable and its message model"
status: in-progress
updated: 2026-10-29
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-cable"]
deps:
  [
    "solid-cable-package-skeleton",
    "port-activejob-execution",
    "port-actioncable-subscriber-map-base-adapter-and-channel-prefix",
  ]
deps-rfc: []
est-loc: 450
pr: trails#9445
claim: "2026-10-29T16:09:47Z"
assignee: "port-solid-cable-adapter"
blocked-by: null
closed-reason: null
priority: 6
---

## Context

`vendor/solid_cable/v3.0.7/lib/action_cable/subscription_adapter/solid_cable.rb`
subclasses `SubscriptionAdapter::Base` and polls `SolidCable::Message`
(`app/models/solid_cable/message.rb`) through a `Listener` thread. RFC 0177
ports the base adapter and the subscriber map
(`port-actioncable-subscriber-map-base-adapter-and-channel-prefix`). The
Redis adapter is in the unported register. The trim job
(`app/jobs/solid_cable/trim_job.rb`) needs ActiveJob execution
(`port-activejob-execution`, RFC 0169). The `solid_cable_messages` table comes
from the gem's `lib/generators/solid_cable/install/templates/db/cable_schema.rb`.

## Acceptance criteria

- In `packages/solid-cable` (from `solid-cable-package-skeleton`), the
  adapter, the `Message` model and the trim job ported at their Rails names.
  The table is built from the gem's `cable_schema.rb`, not a bespoke
  table. The listener's polling loop is an async timer.
- The gem's adapter tests run on all three AR adapters, through
  actioncable's shared `common.rb` behaviors once RFC 0177 ports them.
- The solid_cable source turns on compare.
