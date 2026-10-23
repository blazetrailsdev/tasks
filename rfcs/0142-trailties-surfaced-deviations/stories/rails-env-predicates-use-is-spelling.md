---
title: 'Rails.env predicates use the is… spelling, not ["local?"]()'
status: draft
updated: 2026-10-23
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

trails#9273 taught `StringInquirer` (`packages/activesupport/src/string-inquirer.ts`) to answer `is…`-spelled predicates, so `mode.isInline()` reads Ruby's `mode.inline?` (`solid_queue/lib/solid_queue/processes/runnable.rb`). The repo-wide predicate convention is `isFoo` for `foo?` (CLAUDE.md § "Ruby protocol methods with a different JS mechanism"; `Mime::Type`'s trap). `Rails.env` call sites still index the Ruby name:

- `packages/trailties/src/application/configuration.ts:326,442,447` — `Trails.env["local?"]()`
- `packages/trailties/src/application.ts:164`, `engine.ts:328`, `application/finisher.ts:131`
- `packages/activerecord/src/migration.ts:195` — `Trails.env["local?"]()`
- `packages/actionpack/src/action-controller/log-subscriber.ts:68`, `action-dispatch/log-subscriber.ts:19` — `["development?"]()`

`EnvironmentInquirer` (`packages/activesupport/src/environment-inquirer.ts`) defines `"local?"` and the generated `"development?"`/`"test?"`/`"production?"` as quoted members (Rails `environment_inquirer.rb:28-36`).

## Acceptance criteria

- `EnvironmentInquirer` exposes `isLocal()` / `isDevelopment()` / `isTest()` / `isProduction()` typed members (the Rails `local?` etc.), and the quoted `"x?"` members are removed.
- Every call site above uses the `is…` spelling; none index a `"…?"` name.
- `string-inquirer.test.ts` / `environment-inquirer` tests updated to the `is…` spelling.
