---
title: "ActiveRecord trailtie lacks active_record.query_log_tags_config; loadDefaults 7.1 writes ':sqlcommenter'"
status: ready
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `active_record.query_log_tags_config` initializer
(`vendor/rails/activerecord/lib/active_record/railtie.rb:365-390`) runs only when
`config.active_record.query_log_tags_enabled` is set. It does the following:

- Installs the default `taggings`.
- Sets `ActiveRecord.disable_prepared_statements = true`.
- Assigns `ActiveRecord::QueryLogs.tags` from `query_log_tags`.
- Assigns `QueryLogs.tags_formatter = query_log_tags_format` (`:383-385`).
- Turns on `cache_query_log_tags`.

trailties' `Trailtie` (`packages/trailties/src/trailties/active-record.ts`) seeds
the four `queryLogTags*` config keys (`:108`) and excludes them from
`set_configs` (`:174-177`), as Rails does (`railtie.rb:228-231`). But it has no
`query_log_tags_config` initializer: `grep -rn "QueryLogs\|query_log_tags_config"
packages/trailties/src` finds nothing. So enabling query log tags in an app does
nothing.

There is also a spelling defect that will surface as soon as the initializer
lands. `Configuration#loadDefaults` 7.1
(`packages/trailties/src/application/configuration.ts:307`, Rails
`configuration.rb` 7.1 arm) writes `activeRecord.queryLogTagsFormat = ":sqlcommenter"`.
`QueryLogs.tagsFormatter=` (`packages/activerecord/src/query-logs.ts:70-80`, Rails
`query_logs.rb:126-135`) matches only the bare `"legacy"` / `"sqlcommenter"`, and
the config type is `"legacy" | "sqlcommenter"`. A Symbol is a bare JS string
wherever Symbol-ness is not observable (CLAUDE.md, "A Ruby Symbol is a JS
string"), and it is not observable here. #8095 fixed the same defect for
`generateSecureTokenOn`.

## Acceptance criteria

- `initializer("active_record.query_log_tags_config")` is ported on the
  ActiveRecord trailtie with Rails' guards and branch order
  (`railtie.rb:365-390`).
- `loadDefaults("7.1")` writes `queryLogTagsFormat = "sqlcommenter"` (bare).
- A booted app with `queryLogTagsEnabled = true` and `loadDefaults("7.1")` gets
  `QueryLogs.tagsFormatter === "sqlcommenter"`.
