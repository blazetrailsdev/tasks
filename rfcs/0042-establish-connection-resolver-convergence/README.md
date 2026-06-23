---
rfc: "0042-establish-connection-resolver-convergence"
title: "Converge Base.establishConnection onto resolveConfigForConnection (single DatabaseConfig funnel)"
status: active
created: 2026-06-21
updated: 2026-06-21
owner: "@your-handle"
packages:
  - "activerecord"
clusters: []
related-rfcs:
  - "0023-surfaced-deviations"
---

## Motivation

Rails routes **every** `establish_connection` input through one funnel
(`connection_handling.rb:50-53`):

```ruby
def establish_connection(config_or_env = nil)
  config_or_env ||= DEFAULT_ENV.call.to_sym
  db_config = resolve_config_for_connection(config_or_env)  # str/hash/symbol/DatabaseConfig → DatabaseConfig
  connection_handler.establish_connection(db_config, owner_name: self, role: current_role, shard: current_shard)
end
```

There is no "with a db_config" special case: a string URL, a hash, a `:symbol`
env key, `nil`, and a `DatabaseConfig` instance all resolve to a
`DatabaseConfig` first, then the handler is called with that object.

trails forks instead. `establishConnection` (`connection-handling.ts:660-677`)
has three divergent branches:

- `undefined` → `autoConnect` (builds a `DatabaseConfig` from `configurations`,
  then rebuilds a fresh one inside `establishWithConfig`),
- `DatabaseConfig` → `establishWithDbConfig` (added by RFC 0023
  `establish-connection-accepts-databaseconfig-object`; routes the object
  straight through — the faithful path),
- `string | hash` → bespoke `resolveConfig` + `establishWithConfig` (which
  constructs its **own** `UrlConfig`/`HashConfig` from the parsed hash).

We already have `resolveConfigForConnection` (`connection-handling.ts:1019`), a
faithful mirror of `resolve_config_for_connection`, but it is only wired into
`connectsTo` (line 90), not the main `establishConnection` path.

The `DatabaseConfig` branch from RFC 0023 demonstrates the target shape: resolve
to an object, hand it to the handler verbatim. This RFC converges the remaining
branches onto that single funnel so `establishConnection` becomes a literal
mirror of Rails, leaving `buildAdapterArg` (trails' adapter constructors don't
all accept a hash) as the only intentional deviation.

## Stories

1. **route-establish-connection-string-hash-through-resolver** — resolve the
   `string | hash` branch through `resolveConfigForConnection` → `DatabaseConfig`
   → the single object path; delete bespoke `resolveConfig`. Preserve
   `validateConfigDefaultTimezone` tz handling and `buildAdapterArg`.
2. **funnel-autoconnect-through-object-path** — route the `undefined`/`autoConnect`
   branch onto the same funnel (it already produces a `DatabaseConfig`; stop
   rebuilding a fresh one in `establishWithConfig`). After this + story 1,
   `establishWithDbConfig` IS the core of `establishConnection`.
3. **establish-with-config-stores-urlconfig-discrete-fields** — the optional
   criterion deferred from RFC 0023's story: have `establishWithConfig` store a
   `UrlConfig` with the URL decomposed into discrete fields (Rails' `UrlConfig`
   shape) and audit whether the `buildAdapterArg` URL-forwarding branch
   (`adapter-args.ts:143`) can then be simplified or removed.

<!-- generated: stories table -->

| ID                                                                                                                            | Title                                                                                             | Status | Est LOC | Cluster |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ | ------- | ------- |
| [establish-with-config-stores-urlconfig-discrete-fields](stories/establish-with-config-stores-urlconfig-discrete-fields.md)   | establishWithConfig stores a UrlConfig with discrete fields; audit buildAdapterArg URL-forwarding | done   | 90      | —       |
| [funnel-autoconnect-through-object-path](stories/funnel-autoconnect-through-object-path.md)                                   | Funnel autoConnect through the single DatabaseConfig object path                                  | done   | 100     | —       |
| [infer-adapter-at-config-build-for-schemeless-url](stories/infer-adapter-at-config-build-for-schemeless-url.md)               | Infer adapter at config-build time for scheme-less URL shorthand                                  | done   | 60      | —       |
| [route-establish-connection-string-hash-through-resolver](stories/route-establish-connection-string-hash-through-resolver.md) | Route establishConnection string/hash branch through resolveConfigForConnection                   | done   | 120     | —       |

## Non-goals

- Removing `buildAdapterArg` (trails-specific adapter-constructor shaping) —
  only auditing whether its URL-forwarding branch survives story 3.
- Changing `ConnectionHandler.establishConnection` itself; this is purely about
  the `Base.establishConnection` resolution funnel.

## Acceptance (per story)

- api:compare + test:compare delta non-negative.
- No bespoke schemas; canonical fixtures only.
- Each story ships as one PR from main, ≤500 LOC.
