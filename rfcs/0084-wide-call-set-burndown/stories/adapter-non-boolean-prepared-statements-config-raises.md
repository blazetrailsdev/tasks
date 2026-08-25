---
title: "trails raises on a non-boolean prepared_statements config where Rails passes it through"
status: done
updated: 2026-08-15
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 1
pr: 6556
claim: "2026-08-15T00:45:07Z"
assignee: "adapter-non-boolean-prepared-statements-config-raises"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6455, which converged `@prepared_statements` onto Rails'
common-tail read
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:159`):

```ruby
@prepared_statements = !ActiveRecord.disable_prepared_statements && self.class.type_cast_config_to_boolean(
  @config.fetch(:prepared_statements) { default_prepared_statements }
)
```

`type_cast_config_to_boolean` (abstract_adapter.rb:65-71) maps ONLY the string
`"false"` to `false` and returns everything else UNCHANGED:

```ruby
def self.type_cast_config_to_boolean(config)
  if config == "false"
    false
  else
    config
  end
end
```

So in Rails `prepared_statements: 0` yields `@prepared_statements = 0`, which is
TRUTHY in Ruby — prepared statements stay ON. trails instead throws a
`TypeError` from the `preparedStatements` setter
(`packages/activerecord/src/connection-adapters/abstract-adapter.ts`, the
`typeof value !== "boolean"` guard), because the type-cast passes the `0`
straight through to it.

The guard is a trails invention: Rails has no writer for
`@prepared_statements` at all. PR #6455 reduced the setter to a plain
assignment plus this guard, and three statement-pool tests currently PIN the
raise (`"rejects non-boolean preparedStatements at construction time and via
assignment"` in the postgresql / abstract-mysql-adapter / sqlite3 statement-pool
suites) — so converging means changing those assertions too.

## Converged shape

Decide, with the Rails cite, between:

1. **Converge fully** — drop the non-boolean `TypeError` from the setter so a
   config value survives exactly as `type_cast_config_to_boolean` leaves it,
   and make the truthiness test at the read sites Ruby-shaped (`x != null &&
x !== false`, per CLAUDE.md's truthiness rule) rather than assuming boolean.
   Update the three statement-pool assertions to Rails' behaviour.
2. **Keep the guard** as a deliberate stricter-than-Rails contract — but then
   justify it AT THE CALL SITE with the Rails cite and state the behavioural
   difference explicitly, and say why a database.yml value that Rails accepts
   should crash trails.

(1) is the default per the repo's converge-never-ratify rule; (2) needs a real
argument.

## Acceptance criteria

- [ ] `prepared_statements: 0` behaves as Rails does, or the deviation is
      justified at the call site with the abstract_adapter.rb:65 cite.
- [ ] The three statement-pool suites assert whatever Rails actually does.
- [ ] Adapter tests pass on sqlite3, postgresql and mysql2.
