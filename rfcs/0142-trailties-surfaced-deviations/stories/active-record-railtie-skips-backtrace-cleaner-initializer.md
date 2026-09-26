---
title: "ActiveRecord railtie has no active_record.backtrace_cleaner initializer (railtie.rb:101-102)"
status: in-progress
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: 4
pr: trails#8130
claim: "2026-09-26T02:17:05Z"
assignee: "mapper-drops-its-own-routes-buffer"
blocked-by: null
closed-reason: null
---

## Context

Rails' ActiveRecord railtie wires the application's backtrace cleaner into the SQL log subscriber:
`initializer "active_record.backtrace_cleaner" do ActiveSupport.on_load(:active_record) { LogSubscriber.backtrace_cleaner = ::Rails.backtrace_cleaner } end`
(`vendor/rails/activerecord/lib/active_record/railtie.rb:101-102`). `Rails::BacktraceCleaner`
silences every frame outside the app root, so `verbose_query_logs`' `↳` line
(`log_subscriber.rb:127-135`, `query_source_location`) names the application frame that
issued the query.

trails#8101 made `ActiveRecord::LogSubscriber.backtraceCleaner` a `classAttribute` defaulting
to a plain `BacktraceCleaner` (`packages/activerecord/src/log-subscriber.ts`), as
`log_subscriber.rb:7` does. But `packages/trailties/src/trailties/active-record.ts` has no
`active_record.backtrace_cleaner` initializer, so in a booted app the cleaner is never replaced.
The `↳` line then points into the framework (e.g. `log-subscriber.ts`) instead of the app.
`Trails.backtraceCleaner` exists (`packages/trailties/src/rails.ts`).

## Converged shape

In the trailties ActiveRecord railtie, add
`this.initializer("active_record.backtrace_cleaner", () => onLoad("active_record", () => { LogSubscriber.backtraceCleaner = Trails.backtraceCleaner; }))`,
placed at the railtie.rb:101 position in the initializer list.

## Acceptance criteria

- The initializer exists in the Rails position.
- A booted-app test with `verboseQueryLogs` on asserts the `↳` frame is an app file, not a framework file.
