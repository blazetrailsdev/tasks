---
title: "Port active_record.add_watchable_files so schema changes trigger reloading"
status: draft
updated: 2026-09-29
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

Rails' ActiveRecord railtie has `initializer "active_record.add_watchable_files"`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/railtie.rb:294-297`):

```ruby
path = app.paths["db"].first
config.watchable_files.concat ["#{path}/schema.rb", "#{path}/structure.sql"]
```

trails' `packages/trailties/src/trailties/active-record.ts` does not port it.
Nothing in trails pushes onto `config.watchableFiles` / `config.watchableDirs`
(`packages/trailties/src/trailtie/configuration.ts:63-67`). So the file watcher
that `Finisher#set_clear_dependencies_hook` builds from `Application#watchableArgs`
(ported in trails#8246, `finisher.rb:204-206`, `application.rb:426-434`) watches
nothing. Rails' "added files (like db/schema.rb) also trigger reloading"
(`railties/test/application/loading_test.rb:230`) cannot hold.

## Acceptance criteria

- [ ] `active_record.add_watchable_files` is ported in `trailties/active-record.ts` in Rails declaration order, and concats `<db>/schema.ts`-equivalent and `structure.sql` onto `config.watchableFiles`. Use the trails spelling of the schema dump file, citing where it is chosen.
- [ ] A test shows that touching the schema file makes `app.reloader.check()` true with reloading enabled.
