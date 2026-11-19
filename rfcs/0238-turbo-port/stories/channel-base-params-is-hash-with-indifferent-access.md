---
title: "Channel::Base#params is typed as the HashWithIndifferentAccess Subscriptions#add passes"
status: ready
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionCable::Connection::Subscriptions#add` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/subscriptions.rb`)
builds a channel with `id_options = ActiveSupport::JSON.decode(id_key).with_indifferent_access`, and
`Channel::Base#initialize(connection, identifier, params = {})` (`channel/base.rb:155-158`) stores it as `@params`.
trails' `Subscriptions#add` (`packages/actioncable/lib/connection/subscriptions.ts`) passes a
`HashWithIndifferentAccess` (a `Map`), but `Channel::Base` declares `params: Data = Record<string, unknown>`
(`packages/actioncable/lib/channel/base.ts:35,93,132`). So `this.params["x"]` type-checks and reads `undefined` on a
live subscription, while unit tests that construct a channel with a plain object pass. This hid trails#10369's bug: every
live `Turbo::StreamsChannel` subscription was rejected.

## Acceptance criteria

- `Channel::Base#params` is typed `HashWithIndifferentAccess`, as `Subscriptions#add` builds it, and the
  constructor default is an empty HWIA, matching Rails' `params = {}` read through `with_indifferent_access` callers.
- Every `params[...]` read in channel code (actioncable, turbo, dummies) is `params.get(...)` / `hashAref`, and
  the channel test-case helpers (`channel/test-case.ts` `subscribe`) pass an HWIA, so a plain-object read cannot pass a
  unit test and fail live.
