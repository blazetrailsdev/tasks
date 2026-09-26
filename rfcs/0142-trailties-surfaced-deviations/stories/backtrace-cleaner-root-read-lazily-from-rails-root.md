---
title: "Rails::BacktraceCleaner reads Rails.root lazily in its filter instead of an invented setRoot (backtrace_cleaner.rb:14-16)"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Rails::BacktraceCleaner#initialize` (`vendor/rails/railties/lib/rails/backtrace_cleaner.rb:11-17`) resolves the app root lazily inside its filter:

```ruby
add_filter do |line|
  # We may be called before Rails.root is assigned.
  # When that happens we fallback to not truncating.
  @root ||= Rails.root && "#{Rails.root}/"
  @root && line.start_with?(@root) ? line.from(@root.size) : line
end
```

trails' `BacktraceCleaner` (`packages/trailties/src/backtrace-cleaner.ts`) reads a `_root` that only an invented `setRoot()` assigns. Nothing in a booted app calls it (grep shows no production caller). Absolute app frames are therefore never truncated, and `APP_DIRS_PATTERN` silences them. Surfaced by trails#8130: its `active_record.backtrace_cleaner` cover in `packages/trailties/src/trailties/active-record.trails.test.ts` has to call `Trails.backtraceCleaner.setRoot("/srv/blog")` by hand.

`Trails.root()` is async (`packages/trailties/src/rails.ts`), which is why the root can't just be read lazily and synchronously. But `Trails.application.config.root` is synchronous once the application is configured.

## Converged shape

The filter memoizes `@root ||= Rails.root && "#{Rails.root}/"` from the synchronously available configured root, as `backtrace_cleaner.rb:14-16` does. `setRoot` is deleted, and the trails test stops seeding it.

## Acceptance criteria

- `setRoot` is gone. The first filter reads the configured app root lazily and memoizes it.
- A booted app with `verboseQueryLogs` logs a `↳ app/...` frame without the test assigning a root.
