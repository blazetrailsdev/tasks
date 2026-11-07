---
title: "Converge db:system:change generator edits onto Rails private helpers"
status: done
updated: 2026-11-07
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9841
claim: "2026-11-07T17:17:13Z"
assignee: "app-generator-adds-master-key-and-credentials"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/trails/db/system/change/change-generator.ts` diverges from `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/db/system/change/change_generator.rb`:

- `editPackageJson` (stands in for `edit_gemfile`, `:41-45`) and `editDockerfile` (`:47-53`) open-code reads and writes through an invented private `writeOrUpdate`. Rails uses `gsub_file` with `all_database_gems_regex` / `all_docker_bases_regex` / `all_docker_builds_regex` (`:91-102`) and `gem_entry_for` (`:108-111`).
- `editDevcontainerJson` (`:113-118`) inlines Rails' `update_devcontainer_db_host` (`:147-166`), `update_devcontainer_db_feature` (`:168-181`), `devcontainer_json` (`:183-187`) and `devcontainer_json_path` (`:189-191`). It also throws invented `Could not parse ...` errors, and `JSON.parse` rejects the `//` comments in the Rails devcontainer.json fixture (`railties/test/fixtures/.devcontainer/devcontainer.json`).
- The module-level `dockerPackages` / `dockerPackagesRegex` replace `docker_base_packages` / `docker_build_packages` / `all_docker_bases` / `all_docker_builds` (`:67-89`).

## Acceptance criteria

- Each Rails private helper above exists under its Rails name with Rails control flow. `writeOrUpdate` and the module-level helpers are gone, and edits go through `gsubFile`.
- devcontainer.json is read the way Rails' `JSON.load` reads it, so the commented fixture in `src/__fixtures__/generators/.devcontainer/devcontainer.json` can carry the Rails comments again.
- `change-generator.test.ts` stays green.
