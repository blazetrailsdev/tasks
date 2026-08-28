---
title: "default_timezone is read off @config per call instead of the validated ivar"
status: done
updated: 2026-08-28
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7141
claim: "2026-08-27T23:27:55Z"
assignee: "adapter-default-timezone-is-a-config-read-not-the-rails-ivar"
blocked-by: null
closed-reason: null
---

## Context

Rails assigns `@default_timezone` once, in `AbstractAdapter#initialize`
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:167`):

```ruby
@default_timezone = self.class.validate_default_timezone(@config[:default_timezone])
```

and then reads the IVAR in two places with two different meanings:

- `abstract_adapter.rb:219-221` — the public reader,
  `@default_timezone || ActiveRecord.default_timezone`.
- `abstract_adapter.rb:1106-1109` (`extended_type_map_key`) and
  `abstract_mysql_adapter.rb:762-768` — the RAW ivar, `if @default_timezone`,
  deliberately without the `ActiveRecord.default_timezone` fallback, so an
  unconfigured adapter contributes no `default_timezone` to the type-map cache
  key.

trails has no such field. Both readers dig into `@config` at call time:

- `connection-adapters/abstract-adapter.ts` `get defaultTimezone()` returns
  `this._config.defaultTimezone` when it is a string, else the literal
  `"utc"` — NOT `ActiveRecord.defaultTimezone`, so a global
  `ActiveRecord.defaultTimezone = "local"` does not reach the adapter.
- `abstract-adapter.ts` `extendedTypeMapKey` and
  `abstract-mysql-adapter.ts` `extendedTypeMapKey` both read
  `this._config.defaultTimezone` directly.

`validate_default_timezone` IS ported
(`abstract-adapter.ts`, `static validateDefaultTimezone`) but has no caller on
this path — nothing validates the configured value at construction, so an
invalid `default_timezone` reaches the type map instead of raising where Rails
raises.

Two consequences already observed:

- The `"utc"` fallback silently diverges from `ActiveRecord.default_timezone`.
- A constructor-less adapter throws where Ruby reads a nil ivar. PR #7077
  hit this: routing MySQL casting through the inherited `type_map` made
  `extendedTypeMapKey` reachable from every `lookupCastType`, and the
  `Object.create(AbstractMysqlAdapter.prototype)` doubles in
  `abstract-mysql-adapter.trails.test.ts` threw
  `Cannot read properties of undefined (reading 'defaultTimezone')` on all
  three lanes. That was patched by planting `_config = {}` on the doubles;
  the underlying reader shape is untouched.

## Converged shape

Port `@default_timezone` as a field on `AbstractAdapter`, assigned in the
constructor from `validateDefaultTimezone(this._config.defaultTimezone)`
(`abstract_adapter.rb:167`), then:

- `get defaultTimezone()` becomes
  `this._defaultTimezone ?? ActiveRecord.defaultTimezone`
  (`abstract_adapter.rb:219-221`) — dropping the `"utc"` literal.
- Both `extendedTypeMapKey` bodies read the raw field, matching
  `abstract_adapter.rb:1106-1109` and `abstract_mysql_adapter.rb:762-768`,
  and stop reaching into `_config`.

Note the existing comment in `_acceptDeprecatedRawConnection`
(`abstract-adapter.ts`) asserting that "advisory_locks / default_timezone are
read lazily from `_config` by their getters" — that is the convention this
story retires for `default_timezone`; the deprecated-raw-connection path must
assign the field too, since Rails' common tail runs for it.

## Acceptance criteria

- [ ] `AbstractAdapter` carries a `default_timezone` field assigned in the
      constructor through `validateDefaultTimezone`.
- [ ] `defaultTimezone` falls back to `ActiveRecord.defaultTimezone`, not the
      `"utc"` literal, with a test pinning a non-UTC global.
- [ ] Both `extendedTypeMapKey` bodies read the field, not `_config`.
- [ ] An invalid configured `default_timezone` raises where
      `abstract_adapter.rb:167` raises.
- [ ] The `_config = {}` plants added to the doubles in
      `abstract-mysql-adapter.trails.test.ts` by PR #7077 are no longer needed
      for this path and are removed.
- [ ] All three lanes green.

## Provenance

Surfaced by PR #7077 (`mysql-native-type-map-converges-onto-type-map`).
