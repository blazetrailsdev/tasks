---
title: "Type Channel#pubsub and widen Connection#websocket so tests read them as Rails does"
status: ready
updated: 2026-10-26
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#9302 (`packages/actioncable/src/channel/stream.test.ts`), which reaches two Rails-public readers by other routes:

- `channel.pubsub`: Rails `delegate :pubsub, to: :connection` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/channel/streams.rb:152-153`), which the test reads as `channel.pubsub.class` (`vendor/rails/v8.0.2/actioncable/test/channel/stream_test.rb:102,119`). In trails `pubsub` sits in the private section of `defineModule` in `packages/actioncable/src/channel/streams.ts`, so `Included<typeof Streams>` has no `pubsub` and `Channel::Base` can't type it. The test reads `connection.pubsub` instead.
- `connection.websocket`: the test subclass declares `attr_reader :websocket` (`stream_test.rb:9-10`). `packages/actioncable/src/connection/base.ts` has `private get websocket()`, and a TS subclass can't widen a private member, so `stream.test.ts` and `connection/base.test.ts` cast to reach it.

## Acceptance criteria

- `Channel::Base` types `pubsub` (declared from `Streams`), and `stream.test.ts` reads `channel.pubsub` as Rails does.
- `Connection::Base#websocket` is `protected` (Ruby private), so a test subclass can declare a public reader as Rails' `attr_reader` does, and the `as unknown as { websocket }` casts in both test files are gone.
- `parity:api:extra:gate` and `parity:api:blocks` stay green.
