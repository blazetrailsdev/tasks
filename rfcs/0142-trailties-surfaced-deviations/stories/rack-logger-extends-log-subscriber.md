---
title: "Rack::Logger extends LogSubscriber"
status: draft
updated: 2026-11-20
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

Rails `Rails::Rack::Logger < ActiveSupport::LogSubscriber` (`vendor/rails/v8.0.2/railties/lib/rails/rack/logger.rb:11`). trails' `packages/trailties/lib/rack/logger.ts` `Logger` has no parent: `extends LogSubscriber` reds TS2416 because `Subscriber#call(event: Event): void` (`packages/activesupport/lib/subscriber.ts:174`) and Rack `call(env: RackEnv): Promise<RackResponse>` share the name with incompatible types. Ruby has no such check.

## Acceptance criteria

- `Logger extends LogSubscriber`, with the TS2416 clash resolved by an operator-ratified shape (as CLAUDE.md "Override signature on the static side" did for TS2417), or the story closed `PERMANENT:` on ruling.
