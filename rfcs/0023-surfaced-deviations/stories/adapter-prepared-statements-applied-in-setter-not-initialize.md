---
title: "AbstractAdapter applies disable_prepared_statements in the setter, not initialize"
status: draft
updated: 2026-07-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `disablePreparedStatements` onto the `ActiveRecord`
accessor (PR #5563, RFC 0081).

Rails reads the flag inline in the constructor:
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:159`

```ruby
@prepared_statements = !ActiveRecord.disable_prepared_statements && self.class.type_cast_config_to_boolean(
  @config.fetch(:prepared_statements) { default_prepared_statements }
)
```

The trails port does not. `AbstractAdapter#initialize`
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1281`)
assigns `this.preparedStatements = typeCastConfigToBoolean(...)`, and the flag
is applied inside the `preparedStatements` setter instead
(`abstract-adapter.ts:1058`):

```ts
this._preparedStatements = value && !ActiveRecord.disablePreparedStatements;
```

The in-code comment justifies the setter as "the single chokepoint every adapter
constructor flows through", covering (re-)establishConnection uniformly — but
Rails has no such chokepoint, and the observable difference is that a later
plain assignment to `preparedStatements` re-applies the global flag in trails
and does not in Rails.

PR #5563 baselined the resulting wide call-mismatch rather than converging the
code, because converging touches every adapter constructor path and was out of
scope for an accessor rename:
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/abstract-adapter.json`
(entry `initialize` / `disable_prepared_statements`).

## Acceptance criteria

- Decide whether the setter application is a deviation to converge or a
  deliberate one to document at the call site (per the repo's
  justify-deviations-at-the-call-site rule).
- If converging: read the flag inline in `initialize` as Rails does, and
  confirm each concrete adapter constructor and `establishConnection` /
  `reconnect` path still honours it (that is what the setter was covering).
- If keeping: replace the wide-call baseline entry with a converged state or a
  reason that survives triage, and make the call-site comment state the
  behavioural difference explicitly.
- Adapter tests still pass on sqlite3, postgresql and mysql2.
