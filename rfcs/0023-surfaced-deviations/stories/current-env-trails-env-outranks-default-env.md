---
title: "currentEnv puts TRAILS_ENV ahead of the Rails.env analogue"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent by design: the TRAILS_ENV-first ordering in DatabaseConfigurations.currentEnv() is a deliberate user-directed deviation shipped in #5496, documented at the call site and pinned by a test. The story itself says it was filed for tracking, 'not because a change is known to be wanted'."
---

## Context

`DatabaseConfigurations.currentEnv()`
(`packages/activerecord/src/database-configurations.ts`) resolves
`TRAILS_ENV` → `defaultEnv` → `NODE_ENV` → literal default.

Rails' `ConnectionHandling::RAILS_ENV`
(`vendor/rails/activerecord/lib/active_record/connection_handling.rb:6`) is
`-> { (Rails.env if defined?(Rails.env)) || ENV["RAILS_ENV"].presence || ENV["RACK_ENV"].presence }`
— `Rails.env` (the app-supplied env) outranks the process env vars.

Per BC-2 (`docs/infrastructure/browser-compat-plan.md:66-67, 88`), `TRAILS_ENV`
is the rename of the old `process.env.NODE_ENV` reads, so it maps to
`ENV["RAILS_ENV"]` / `ENV["RACK_ENV"]`, and `defaultEnv` is the `Rails.env`
analogue. By Rails' precedence `defaultEnv` would therefore win — trails
inverts it.

This is a **deliberate, user-directed deviation** shipped in PR #5496 and
documented as such at the call site: `TRAILS_ENV` is how a deploy declares
which environment the process is, and no in-process bootstrap may override it.
Known consequence: with `TRAILS_ENV` set, assigning `defaultEnv` has no effect
on the resolved env. Pinned by the test `currentEnv prefers TRAILS_ENV over an
explicitly set defaultEnv`.

Filed for tracking per the deviation policy, not because a change is known to
be wanted. Converging it would mean flipping two lines in `currentEnv()` and
deleting that test — but that re-exposes the deploy-override hazard, so any
convergence needs the operational question settled first.

## Acceptance criteria

- [ ] Decide whether trails keeps the `TRAILS_ENV`-first ordering or converges
      on Rails' `Rails.env`-first precedence.
- [ ] If converging: `currentEnv()` checks `defaultEnv` before `TRAILS_ENV`,
      and the deviation note in the `currentEnv()` JSDoc is removed.
- [ ] If keeping: the deviation note and its citations stay, and this story is
      closed as a permanent, documented divergence.
