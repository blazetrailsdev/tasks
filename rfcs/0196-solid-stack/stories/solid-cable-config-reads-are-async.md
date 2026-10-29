---
title: "SolidCable config readers are synchronous; trimmable / nonBlockingLock read config as Rails does"
status: draft
updated: 2026-10-29
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SolidCable`'s config readers (`vendor/solid_cable/v3.0.7/lib/solid_cable.rb:9-50`) read
`Rails.application.config_for("cable")` (`:53-55`) synchronously on every call. trails'
`Application#configFor` (`packages/trailties/src/application.ts:331`) is async, so
`packages/solid-cable/src/solid-cable.ts` makes each reader async.

A scope body cannot await and an async class method answering a `Relation` is
flattened by `await` into its records, so two Rails bodies that read config while
building a relation take the value as an argument instead:

- `Message.trimmable` (`app/models/solid_cable/message.rb:5-7`) takes
  `messageRetention` where Rails reads `::SolidCable.message_retention`.
- `Record.nonBlockingLock` (`app/models/solid_cable/record.rb:9-15`) takes
  `useSkipLocked` where Rails reads `SolidCable.use_skip_locked`.

`TrimJob#perform` (`packages/solid-cable/src/trim-job.ts`) carries
`@missingRailsArgs … CONVERGEABLE solid-cable-config-reads-are-async` for both.

Also seen while porting: `OrderedOptions#update` returns the unproxied target
(`packages/activesupport/src/ordered-options.ts:129-132`, methods are bound to
the target in the Proxy `get` trap), so `new OrderedOptions().update(h).foo`
reads `undefined`. `Application#configFor` builds its result exactly that way.

## Acceptance criteria

- `SolidCable`'s readers are synchronous, as in Rails, over a config
  `config_for` has already loaded (e.g. the engine's initializer awaiting it
  once at boot, as § "A translation lookup is synchronous; the load is an
  awaited step" settles for I18n).
- `trimmable` and `nonBlockingLock` take no argument and read the config as
  Rails does; the two `@missingRailsArgs` receipts on `TrimJob#perform` are
  removed.
- `OrderedOptions#update` answers the proxy, so a property read off
  `configFor`'s result works.
