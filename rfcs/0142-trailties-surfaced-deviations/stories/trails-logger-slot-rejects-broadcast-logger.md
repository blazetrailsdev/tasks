---
title: "Trails.logger and its consumer slots are typed Logger, so a BroadcastLogger needs a cast"
status: draft
updated: 2026-11-18
rfc: "0142-trailties-surfaced-deviations"
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

trails#10284 made `ActiveSupport::BroadcastLogger` a plain class again, as Rails has it (`vendor/rails/v8.0.2/activesupport/lib/active_support/broadcast_logger.rb:74-75`: `class BroadcastLogger` / `include ActiveSupport::LoggerSilence`). Rails' `Rails.logger` is duck-typed and holds a `BroadcastLogger` after `initialize_logger` (`vendor/rails/v8.0.2/railties/lib/rails/application/bootstrap.rb:46-69`).

trails types the slot `static logger: Logger | null` (`packages/trailties/lib/trails.ts`) and `TopLevelConstants.Trails.logger: Logger | null` (`packages/activesupport/lib/namespaces.ts`). Since a `BroadcastLogger` is no longer a `Logger`, #10284 added `as unknown as Logger` / `as unknown as BroadcastLogger` casts at:

- `packages/trailties/lib/application/bootstrap.ts` (the `initialize_logger` port)
- `packages/trailties/lib/commands/server.ts`
- `packages/trailties/lib/trailties/active-record.ts`
- `packages/trailties/test/application/bootstrap.test.ts`, `test/application/server.test.ts`, `test/commands/server.trails.test.ts`

Widening the slot directly reds about seven consumers (`log-subscriber.ts:53`, `trailties/action-controller.ts:99`, `trailties/active-job.ts:57`, `trailties/active-record.ts:230`, and the activestorage, actionmailbox, solid-queue and vite-trails engines), whose logger slots are typed `Logger`.

## Converged shape

Every logger slot Rails fills from `Rails.logger` accepts a `BroadcastLogger` without a cast: a logger type naming the surface both classes answer (`add`/`debug`…`unknown`, `level`, `formatter`, `progname`, `silence`), used for `Trails.logger` and each slot it is assigned to.

## Acceptance criteria

- No `as unknown as Logger` / `as unknown as BroadcastLogger` cast remains at the sites above.
- `pnpm build` is clean.
