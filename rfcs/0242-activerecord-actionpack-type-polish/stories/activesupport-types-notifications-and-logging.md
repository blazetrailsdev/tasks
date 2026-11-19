---
title: "activesupport notifications and log subscribers typed without any"
status: in-progress
updated: 2026-11-19
rfc: "0242-activerecord-actionpack-type-polish"
cluster: type-polish-neighbours
packages: [activesupport]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 400
priority: null
pr: trails#10340
claim: "2026-11-19T03:02:14Z"
assignee: "activesupport-types-class-level-mixins"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/lib/log-subscriber.ts` (9 hits), `subscriber.ts`
(6), `notifications.ts` (6) and the tagged-logging casts
(`TaggedFormatter`, 3) carry `any` payloads. Every `ActiveRecord::LogSubscriber`
and `ActionController::LogSubscriber` inherits them. Rails:
`active_support/log_subscriber.rb`, `subscriber.rb`, `notifications.rb`,
`tagged_logging.rb`.

## Acceptance criteria

- [ ] Hits in the files above fall from 26 to ≤ 11 (at least 60%).
- [ ] `Notifications::Event#payload` and subscriber callbacks take
      `Record<string, unknown>` (or a generic payload) instead of `any`.
- [ ] Subclass log subscribers in activerecord and actionpack still
      typecheck with no new cast.

## Verification

Count hits from `packages/activesupport/lib`, before and after, and record both in
the PR body:

```sh
grep -Po ': any|as any|as unknown as' log-subscriber.ts subscriber.ts notifications.ts tagged-logging.ts | wc -l
```

This is the RFC's Motivation command, which counts matches, not lines.
`pnpm typecheck`, `pnpm parity:lint:counts`, `pnpm test:types`,
`pnpm parity:api` and `pnpm parity:test` are green, with non-negative parity
deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
