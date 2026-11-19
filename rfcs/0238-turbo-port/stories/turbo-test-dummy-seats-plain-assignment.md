---
title: "Seat turbo's dummy app and test classes with plain assignments, not constSet"
status: in-progress
updated: 2026-11-19
rfc: "0238-turbo-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#10338
claim: "2026-11-19T03:01:22Z"
assignee: "turbo-test-dummy-seats-plain-assignment"
blocked-by: null
closed-reason: null
---

## Context

trails#10320 removed every `constSet` seat from `packages/turbo/lib`, but the test tree still seats constants with `constSet`:
`packages/turbo/test/dummy/app/components/message-component.ts:19`, `dummy/app/channels/application-cable/channel.ts:7`, `dummy/app/controllers/posts-controller.ts:5`, and `constSet(Turbo, "BroadcastableTest", …)` / `constSet(Turbo, "StreamsChannelTest", …)` in `test/streams/broadcastable.test.ts` and `streams-channel.test.ts`. The Ruby sources are plain class definitions (`vendor/turbo-rails/v2.0.23/test/dummy/app/...`, `test/streams/broadcastable_test.rb:5`), and CLAUDE.md § "Call-time constant resolution" says `constSet` is never the seat spelling.

## Acceptance criteria

- Each seat is a plain typed assignment (`TopLevel.X = X` with a `TopLevelConstants` declaration, or `Turbo.X = X`), or is dropped where nothing resolves the name.
- No `constSet` remains under `packages/turbo/`.
- turbo tests pass.
