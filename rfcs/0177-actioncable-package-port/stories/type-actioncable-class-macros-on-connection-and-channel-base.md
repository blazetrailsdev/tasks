---
title: "Type identified_by / rescue_from / channel callback macros on Connection::Base and Channel::Base"
status: draft
updated: 2026-10-25
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The class macros an application calls on its own subclasses are installed by `include()` / `extend()` but are not on the class type, so every test (and every app) reaches them through a cast:

- `identified_by` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/connection/identification.rb:16-19`), ported at `packages/actioncable/src/connection/identification.ts:21`, is called as `(Connection as unknown as { identifiedBy(...ids: string[]): void }).identifiedBy("id")` in `client.test.ts`, `connection/identifier.test.ts` and `published-client.trails.test.ts`.
- `rescue_from` (ActiveSupport::Rescuable, included into `Connection::Base` at `packages/actioncable/src/connection/base.ts:361`, Rails `connection/base.rb`) is cast at `connection/subscriptions.test.ts`, and the Channel side (`after_subscribe`, `rescue_from`, `periodically`) at `channel/base.test.ts:20-25`.
- `Channel::Base#unsubscribed` is TS-protected, so `assertCalled(channel, "unsubscribed" as never, …)` in `client.test.ts` needs a cast where Rails' `assert_called(channel, :unsubscribed)` (`actioncable/test/client_test.rb:287`) needs none.

## Acceptance criteria

- `Connection::Base` and `Channel::Base` declare their mixed-in class macros on the class side (`declare static identifiedBy: Extended<...>[...]` or equivalent), so `Connection.identifiedBy("id")` and `ChatChannel.rescueFrom(...)` type-check with no cast.
- The casts above are removed from the actioncable tests.
- `pnpm parity:api:extra:gate` stays green (declarations, not new members).
