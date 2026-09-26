---
title: "namespaced-model-generation-builds-illegal-migration-name"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
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

Surfaced in the review of trails#8150. `trails generate scaffold admin/account` throws
`Illegal migration name: CreateAdmin::Accounts (only letters, numbers, and underscores allowed)`.

The throw comes from the legacy `ModelGenerator` (`packages/trailties/src/generators/model-generator.ts`), which `ScaffoldGenerator` still calls. It builds the migration name as `Create${camelize(tableize(className))}` from a `::`-joined class name.

Rails' model generator hands the ORM hook `table_name`, which is `admin_accounts` (`named_base.rb:86-90`). The Active Record model generator then runs `migration_template "create_table_migration.rb", File.join(db_migrate_path, "create_#{table_name}.rb")`. So a namespaced scaffold's migration is `create_admin_accounts`.

As a result, `ScaffoldGenerator`'s namespaced output is unreachable end to end, including the `routeUrl`-based redirects and links #8150 added.

## Acceptance criteria

- A namespaced `scaffold` / `model` generation names its migration `create_<table_name>` (`create_admin_accounts`), following Rails.
- A test runs `ScaffoldGenerator` on `admin/account` and asserts `/admin/accounts` redirects and links.
