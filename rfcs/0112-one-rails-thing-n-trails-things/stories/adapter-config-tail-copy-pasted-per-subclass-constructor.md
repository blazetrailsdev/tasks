---
title: "The adapter config tail is copy-pasted into three subclass constructors"
status: draft
updated: 2026-08-28
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# The adapter config tail is copy-pasted into three subclass constructors

## Context

Rails assigns `@config` once and then runs one common tail in
`AbstractAdapter#initialize`
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:139-172`):

```ruby
@config = config
...
@prepared_statements = !ActiveRecord.disable_prepared_statements && self.class.type_cast_config_to_boolean(
  @config.fetch(:prepared_statements) { default_prepared_statements }
)
@advisory_locks_enabled = self.class.type_cast_config_to_boolean(@config.fetch(:advisory_locks, true))
@default_timezone = self.class.validate_default_timezone(@config[:default_timezone])
```

trails' `AbstractAdapter` constructor is zero-arg, so `_config` is assigned by
each subclass instead — `postgresql-adapter.ts:368`, `mysql2-adapter.ts:217`,
`sqlite3-adapter.ts:265` — and every member of that tail is copy-pasted beside
it. PR #7141 added the `_defaultTimezone` line to all three plus
`_acceptDeprecatedRawConnection`, following the shape already there for
`preparedStatements`: four copies of one Rails line. `advisoryLocks` is a
third variant, still read lazily off `_config` by its getter.

Root cause is the zero-arg constructor, tracked by
[[abstract-adapter-constructor-drops-rails-config-arg]] (RFC 0094); converging
that collapses this tail on its own. This story exists because the tail is the
part that keeps growing a copy per new config key, and it can be collapsed
independently of the signature change.

`TrailsAdapterOptions.defaultTimezone` (`pool-config.ts:211-217`) is the TS
config-shape companion added by the same PR; it has no Rails counterpart
(Ruby reads `@config[:default_timezone]` off a plain Hash) and should be
reviewed as part of whatever shape the converged constructor takes.

## Converged shape

One tail, running once, where Rails runs it: `_config` assigned and then
`preparedStatements` / `advisoryLocks` / `_defaultTimezone` derived from it in
`AbstractAdapter`, with subclasses passing config up rather than re-deriving.
`_acceptDeprecatedRawConnection` shares the same tail (Rails' deprecated path
runs the same `initialize`).

## Acceptance criteria

- [ ] The `preparedStatements` and `_defaultTimezone` assignments exist once,
      not once per adapter.
- [ ] `advisoryLocks` is derived in the same place rather than read lazily off
      `_config` by its getter (`abstract_adapter.rb:163-165`).
- [ ] An invalid `default_timezone` still raises at construction for every
      adapter, including the deprecated raw-connection path.
- [ ] All three lanes green.
