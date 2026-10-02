---
title: "Port lib/action_cable.rb: the ActionCable namespace, INTERNAL and ActionCable.server"
status: draft
updated: 2026-10-01
rfc: "0000-actioncable-package-port"
cluster: fidelity
packages: ["actioncable", "activesupport"]
deps: ["enroll-actioncable-in-compare-tooling-and-parity-gates"]
deps-rfc: []
est-loc: 200
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable.rb` (80 lines) has three parts.

**The loader** (`:35-50`) is Zeitwerk and is not ported (CLAUDE.md § "Trails
has no autoloader"). Its framework-internal effect, that any file can name
`ActionCable::Connection::StreamEventLoop` in a method body, is CLAUDE.md
§ "Call-time constant resolution": `packages/actioncable/src/namespaces.ts`
holds the `ActionCable`, `ActionCable::Server`, `ActionCable::Connection`,
`ActionCable::Channel`, `ActionCable::SubscriptionAdapter` and
`ActionCable::Helpers` namespace objects, extended with
`ActiveSupport::Autoload` the way `packages/arel/src/namespaces.ts` and
`packages/activerecord/src/namespaces.ts` are, and each class seats itself
with `rbModConstSet` in its defining module. This story creates the namespace
objects; each lib story seats its own constants.

**`INTERNAL`** (`:58-74`): message types, disconnect reasons,
`default_mount_path`, and the frozen `protocols` array.

**`ActionCable.server`** (`:77-79`): `module_function def server; @server
||= ActionCable::Server::Base.new; end`. It names `Server::Base` at call
time, so it lands here and resolves once
`port-actioncable-server-connections-and-base` seats the class.

**`TopLevel.ActionCable`.** `packages/activesupport/src/namespaces.ts:58`
already types `ActionCable?: { Engine?: unknown }`, read by the authentication
generator (`packages/trailties/src/generators/rails/authentication/authentication-generator.ts:55`,
Rails' `defined?(ActionCable::Engine)`). Seat the namespace object there and
widen the type to the real namespace.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`INTERNAL` keys are Symbols read with `[:message_types][:welcome]`.** Per RFC 0149 the hash is bare-keyed by the camelCase spelling: `INTERNAL.messageTypes.welcome`, `INTERNAL.disconnectReasons.serverRestart`, `INTERNAL.defaultMountPath`. The values are wire strings and stay as they are (`"confirm_subscription"`).
- [ ] **`protocols` is frozen**; the outer hash is not.
- [ ] **`@server ||=` is reset by tests.** `client_test.rb` does `ActionCable.instance_variable_set(:@server, nil)`. The memo must be an ivar on the namespace object that `rbObjIvarSet` can clear, not a module-scope `let`.
- [ ] **`module_function`** makes `server` callable as `ActionCable.server` and as a private instance method of includers. Only the first has a caller.
- [ ] **Verify the seats with a plain-node import of the built `dist/**.js`\*\*, each defining module as the entry. A vitest run enters through the index and masks a TDZ.

## Acceptance criteria

- [ ] `namespaces.ts` exports the six namespace objects, each extended with `Autoload`, and `TopLevel.ActionCable` is seated.
- [ ] `INTERNAL` and `ActionCable.server` read complete in `parity:api` for `action_cable.rb`.
- [ ] Clearing the `@server` ivar makes the next `ActionCable.server` build a new server.

## Definition of done

A zero-import slot module where a namespace `autoload` works, or a guard on an autoload read Rails does not guard, does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/action-cable.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
