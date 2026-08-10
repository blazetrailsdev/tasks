---
title: "api-compare-skip-initialize-on-prepended-modules"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6134
claim: "2026-08-05T16:13:06Z"
assignee: "abstract-adapter-pool-readers-soften-rails-behaviour"
blocked-by: null
closed-reason: null
---

## Context

`parity:api` scores `messages/rotator.rb -> messages/rotator.ts` at 6/7, and
`parity:api:extra` counts one novel name in that file. Both are the same thing:
Ruby's `Messages::Rotator#initialize` (`rotator.rb:5`).

The extractor maps a Ruby `initialize` to a TS `constructor`. `Rotator` is a
module that Rails installs with `prepend`, and `prepend()`
(`packages/activesupport/src/prepend.ts`) cannot wrap a TypeScript constructor,
so the port exports it as a plain function —
`packages/activesupport/src/messages/rotator.ts:37` — which each rotatable class
calls from its own constructor (`message-verifier.ts`, `message-encryptor.ts`).
There is no TS `constructor` for the extractor to match, and the faithful Rails
name registers as novel extra surface.

This is the same shape as the Ruby lifecycle hooks (`extended`, `included`,
`inherited`) that CLAUDE.md says to record in `SKIP_GROUPS` rather than stub: a
Ruby method with no TypeScript expression at the mapped site.

Filed from PR #5960 (`port-activesupport-messages-rotation-tests`).

## Acceptance criteria

- `initialize` on a prepended/mixin module is excluded via a `SKIP_GROUPS` entry
  (or equivalent) in `scripts/api-compare/conventions.ts`, with a reason
  recorded, so it counts neither as a miss nor as novel extra surface.
- The rule is keyed to the mixin-module case; a real class's `initialize` must
  still be expected to map to a `constructor`.
- `messages/rotator.rb` scores 7/7 and `parity:api:extra` reports 0 novel for
  `messages/rotator.ts`.
- Covered by a test in `scripts/api-compare/`.
