---
title: "engine-controllers-resolve-for-unused-routes"
status: done
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10688
claim: "2026-11-23T21:19:51Z"
assignee: "engine-controllers-resolve-for-unused-routes"
blocked-by: null
closed-reason: null
---

## Context

In a generated app, `bin/trails routes --unused` and
`bin/trails unused_routes` report every Action Mailbox route
(`trails_postmark_inbound_emails`, the conductor routes, …) as unused,
because `RouteInfo` (`packages/trailties/lib/commands/unused-routes.ts`)
calls `safeConstantize("ActionMailbox::Ingresses::Postmark::InboundEmailsController")`
and the constant is never seated. The controllers seat themselves when
`packages/actionmailbox/lib/index.ts` is imported, and nothing imports it on
boot. In Rails the engine's `app/controllers` is autoloaded by Zeitwerk, so
`constantize` finds them (`vendor/rails/v8.0.2/railties/lib/rails/commands/unused_routes/unused_routes_command.rb:11-20`).

Active Storage is not affected only because its engine carries an
`active_storage.app` initializer that imports `./index.js`
(`packages/activestorage/lib/engine.ts`), an initializer Rails' engine
(`vendor/rails/v8.0.2/activestorage/lib/active_storage/engine.rb`) does not
have. Copying it into the mailbox engine would add a second deviation; the fix
is to load a package-shipped engine's controllers the way Zeitwerk does for
an engine's `app/controllers` (see `packages/trailties/CLAUDE.md`,
"The application loader is Zeitwerk"), and retire the Active Storage
initializer with it.

Rails tests that fail on this and are not yet ported:

- `vendor/rails/v8.0.2/railties/test/commands/unused_routes_test.rb`: "no results",
  "no controller", "no action", "implicit render", "multiple unused routes",
  "filter by grep no results", "filter by controller no results"
  (`packages/trailties/test/commands/unused-routes.test.ts`).
- `vendor/rails/v8.0.2/railties/test/commands/routes_test.rb:392-400`
  "rails routes with unused option" (`packages/trailties/test/commands/routes.test.ts`).

## Acceptance criteria

- Action Mailbox's and Active Storage's controllers resolve by constant in a
  booted app with no engine initializer Rails lacks.
- The eight tests above are ported with their Rails bodies and pass.
