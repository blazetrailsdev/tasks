---
title: "Base.inspect's table_exists? arm is ported as a columnsHash-empty check"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8103
claim: "2026-09-25T19:20:45Z"
assignee: "trails-actions-insert-at-marker-instead-of-rails-sentinel"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Core::ClassMethods#inspect`
(`vendor/rails/activerecord/lib/active_record/core.rb:375-388`) branches
`elsif table_exists?` → `"#{super}(#{attr_list})"`, `else` →
`"#{super}(Table doesn't exist)"`.

trails' `Base.inspect` (`packages/activerecord/src/base.ts`, `static inspect()`)
replaces that guard with `Object.keys(this.columnsHash()).length === 0` →
`"(Table doesn't exist)"`, then the attr list. So a table that exists with zero
columns, or a model whose columns come only from attribute declarations, takes
the wrong arm, and the branch order is inverted against Rails.

`table_exists?` is async in trails (`ModelSchema.tableExists`), but `inspect` is
sync; the warm-cache peek `cachedTableExists` (see CLAUDE.md § "Schema
reflection peeks at a warm cache") is the settled sync reader.

## Acceptance criteria

- `Base.inspect` keeps Rails' branch order: `table_exists?` arm (via the
  sync schema-cache peek) before the `Table doesn't exist` fallback.
- `core.test.ts` "inspect class" and "inspect class without table" stay green.
