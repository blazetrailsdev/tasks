---
title: "turbo-streams-channel-class-path"
status: in-progress
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10369
claim: "2026-11-19T18:54:09Z"
assignee: "turbo-streams-channel-class-path"
blocked-by: null
closed-reason: null
---

## Context

`rbModName(StreamsChannel)` answers `"StreamsChannel"` where Rails' `Turbo::StreamsChannel.name`
is `"Turbo::StreamsChannel"`: turbo has no constant table for `lib/app/channels/turbo/streams-channel.ts`
(`scripts/api-compare/class-paths.ts` `LAZY_DIRS.turbo` lists only `app/jobs/turbo/streams/`).
If you add the file to `LAZY_DIRS`, the generator writes `App::Channels::Turbo::StreamsChannel`, because
rails-api.json records the Ruby file as `streams_channel.rb` without its `app/channels/turbo/` directory,
so the Ruby class never pairs with the TS file.

So `assert_turbo_cable_stream_source channel: Turbo::StreamsChannel`
(`vendor/turbo-rails/v2.0.23/lib/turbo/system_test_helper.rb:94-95`, `value.try(:name)`) never matches
the rendered `channel="Turbo::StreamsChannel"` attribute.

## Acceptance criteria

- `rbModName(StreamsChannel) === "Turbo::StreamsChannel"`, through a generated constant table.
- Un-skip "#assert_turbo_cable_stream_source supports String collection filters" in
  `packages/turbo/test/system/assertions.system.test.ts`.
