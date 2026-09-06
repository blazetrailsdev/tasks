---
title: "database-tasks-env-drops-rails-per-process-memo"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
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

Rails memoizes the task env per process
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:103`):

```ruby
def env
  @env ||= Rails.env
end
```

with `attr_writer :env` at `:60` writing the same ivar. So `Rails.env` is
resolved once and a later change to the process environment does not move it.

trails' `DatabaseTasks.env` (`packages/activerecord/src/tasks/database-tasks.ts:52`)
returns `DEFAULT_ENV()` and recomputes on every read. The memo cannot simply be
added at that call site, for two reasons, and both are one layer down:

1. `RAILS_ENV` (`packages/activerecord/src/connection-handling.ts:562-565`,
   Rails' `connection_handling.rb:6`) resolves `TRAILS_ENV` **before** the
   `_railsEnv` slot that `env=` writes. That precedence is deliberate and
   reaffirmed, so the assignment does not seat a value the way Ruby's `@env =`
   does — there is nothing for a memo to hold onto.
2. `DatabaseConfigurationsTest > currentEnv resolution` (three tests,
   `packages/activerecord/src/database-configurations.test.ts:153-175`) pins the
   non-memoized behaviour directly: `currentEnv prefers TRAILS_ENV over NODE_ENV`
   sets `DatabaseTasks.env = "development"`, stubs `TRAILS_ENV=production`, and
   asserts `production`. Under Ruby's `@env ||=` that read returns
   `"development"`.

So the memo is a `connection-handling.ts` question — whether trails' `RAILS_ENV`
should resolve once — not a `database-tasks.ts` one, and answering it means
re-deciding the TRAILS_ENV precedence those three tests pin.

Surfaced by review of PR #7533
(`database-configurations-default-env-is-a-public-static`), which moved the
`default_env` assignment half onto `DatabaseTasks.env` / `env=` — the correct
Rails home — but carried the existing memory-less getter across unchanged. Not a
regression from that PR: the `DatabaseConfigurations.defaultEnv` static it
replaced was equally memory-less.

## Acceptance criteria

- A decision is recorded on whether trails' `RAILS_ENV` resolves once per
  process the way `Rails.env` + `@env ||=` do, or stays live.
- If it memoizes: `DatabaseTasks.env` reads as `database_tasks.rb:103`, `env=`
  seats the memo, and the three `currentEnv resolution` tests are re-derived
  from Rails rather than renamed (test names do not change).
- If it stays live: the divergence carries a receipt at
  `connection-handling.ts`'s `RAILS_ENV` naming the reason, so the next reader
  does not re-open it.
