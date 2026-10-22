---
title: "Server::Base#pubsub answers the adapter synchronously (prewarm the adapter load)"
status: draft
updated: 2026-10-22
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Server::Base#pubsub` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/base.rb:93-95`) is
`@pubsub || @mutex.synchronize { @pubsub ||= config.pubsub_adapter.new(self) }` and answers the
adapter synchronously. In trails (`packages/actioncable/src/server/base.ts`, trails#9258) it answers
`PubSub | Promise<PubSub>`, because `Configuration#pubsubAdapter` awaits the adapter file's
`import()`. Because of that, `Server::Broadcasting::Broadcaster#broadcast`
(`packages/actioncable/src/server/broadcasting.ts`) has to `await this.server.pubsub`, and
`Connection::InternalChannel` reads `pubsub` synchronously, which breaks if the adapter has not
loaded yet.

## Converged shape

Follow CLAUDE.md § "An adapter file is loaded by an awaited step". Load the adapter file once, in
an awaited boot step (the actioncable engine initializer, or the first `ActionCable.server` setup
that is already awaited). After that, `pubsub_adapter` resolves the constant synchronously, and
`pubsub` is a synchronous getter answering the adapter, as Rails' does. `Broadcaster#broadcast`
then drops its `await` on `pubsub`.

## Acceptance criteria

- [ ] `Server::Base#pubsub` returns the adapter instance and never a promise. Its double-checked
      `??=` needs no monitor, because it no longer spans an `await`.
- [ ] `Configuration#pubsubAdapter` is synchronous after the boot step. The load step raises
      Rails' `LoadError` messages from `configuration.rb`.
- [ ] `Broadcaster#broadcast` reads `this.server.pubsub` with no `await`.
- [ ] The parity gates stay green.
