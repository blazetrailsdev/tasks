---
title: "Port the active_record.migration_error initializer (page_load inserts CheckPending)"
status: draft
updated: 2026-09-25
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

Since trails#8099 the generated `config/environments/development.ts` sets
`this.config.activeRecord.migrationError = "page_load"`, as
`development.rb.tt:54` does. Nothing consumes it: trails'
`active_record.set_configs` (`packages/trailties/src/trailties/active-record.ts`)
only lists `migrationError` in its `except` set.

Rails consumes it in its own initializer
(`activerecord/lib/active_record/railtie.rb:105-111`):

    initializer "active_record.migration_error" do |app|
      if config.active_record.migration_error == :page_load
        config.app_middleware.insert_after ::ActionDispatch::Callbacks,
          ActiveRecord::Migration::CheckPending,
          file_watcher: app.config.file_watcher
      end
    end

## Acceptance criteria

- `packages/trailties/src/trailties/active-record.ts` registers the
  `active_record.migration_error` initializer in Rails' position.
- When the value is `"page_load"`, it inserts
  `Migration.CheckPending` after `ActionDispatch::Callbacks` with
  `fileWatcher: app.config.fileWatcher`.
- A test asserts that the middleware is present when the setting is
  `"page_load"` and absent otherwise.
