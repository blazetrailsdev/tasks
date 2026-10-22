---
title: "NamedBase#file_name is a memoized method; TestUnit ChannelGenerator overrides it instead of mutating in a constructor"
status: draft
updated: 2026-10-22
rfc: "0171-thor-port"
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

Rails' `TestUnit::Generators::ChannelGenerator` overrides the private
`file_name` method (`vendor/rails/v8.0.2/actioncable/lib/rails/generators/test_unit/channel_generator.rb:17-19`):
`@_file_name ||= super.sub(/_channel\z/i, "")`. `Rails::Generators::NamedBase#file_name`
is a memoized method (`vendor/rails/v8.0.2/railties/lib/rails/generators/named_base.rb`).

In trails, `NamedBase.fileName` is a field set by `assignNamesBang`
(`packages/trailties/src/generators/named-base.ts:24,151`). A subclass method
cannot shadow it, so trails#9210 strips the suffix in an invented constructor
(`packages/trailties/src/generators/test-unit/channel/channel-generator.ts`).

## Converged shape

`NamedBase#fileName()` is a memoized method (`@_file_name ||= …`), and
`ChannelGenerator` overrides it privately, after `createTestFiles`, as
`return (this._fileName ??= super.fileName().replace(/_channel$/i, ""))`. The constructor goes.

## Acceptance criteria

- [ ] `fileName` is a method on NamedBase; every reader calls it.
- [ ] `ChannelGenerator` has no constructor, and its `fileName` override sits in Rails' position.
- [ ] `channel-generator.trails.test.ts` still passes (`chat` and `chat_channel` both write `chat-channel.test.ts`).
