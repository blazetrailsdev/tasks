---
title: "turbo-broadcastable-morph-tests"
status: done
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10320
claim: "2026-11-18T21:53:07Z"
assignee: "activejob-actioncable-before-setup-signatures-intersect"
blocked-by: null
closed-reason: null
---

## Context

trails#10305 ported `Turbo::Broadcastable`'s instance methods
(`packages/turbo/lib/app/models/concerns/turbo/broadcastable.ts`) and 50 of
the 54 `Turbo::BroadcastableTest` cases into
`packages/turbo/test/streams/broadcastable.test.ts`. The four morph cases were
left out to fit the PR LOC ceiling:
`vendor/turbo-rails/v2.0.23/test/streams/broadcastable_test.rb:375-397`
("broadcasting replace morph to stream now", "broadcasting update morph to
stream now targeting", "broadcasting replace morph now", "broadcasting update
morph now"). They pass `attributes: { method: :morph }` and expect
`turbo_stream_action_tag(..., method: :morph, template: render(@message))`.
They passed locally against the ported code before removal.

## Acceptance criteria

- The four tests are ported verbatim under their Rails names in
  `packages/turbo/test/streams/broadcastable.test.ts`, against the dummy
  `Message` model.
