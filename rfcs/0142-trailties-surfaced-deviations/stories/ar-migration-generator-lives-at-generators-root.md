---
title: "ar-migration-generator-lives-at-generators-root"
status: draft
updated: 2026-09-30
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

Rails' `ActiveRecord::Generators::MigrationGenerator` lives at
`activerecord/lib/rails/generators/active_record/migration/migration_generator.rb`
and is reachable as the `active_record:migration` namespace, which
`rails g migration` reaches through `Rails::Generators::MigrationGenerator`'s
`hook_for :orm, required: true`
(`railties/lib/rails/generators/rails/migration/migration_generator.rb:6`).

trails' port is `packages/trailties/src/generators/migration-generator.ts`, at
the generators root. trails#8269 gave it its Ruby name by
`Object.defineProperty(MigrationGenerator, "name", { value:
"ActiveRecord::Generators::MigrationGenerator" })`, the same spelling
`rails/resource/resource-generator.ts:24` and
`rails/scaffold/scaffold-generator.ts:23` use, so `base_name` / `generator_name`
drive `default_source_root` to `generators/active-record/migration/templates/`.
The file itself was not moved because:

- `commands/generate.ts:4`, `generators/index.ts:4`, `generators/model-generator.ts:3`
  and `packages/website/src/lib/frontiers/vfs-generator.ts` import it by path.
- Moving it under `generators/active-record/migration/` puts it in
  `Generators.lookupPaths()` (`packages/trailties/src/generators.ts`), whose
  `requireGenerator` registers it as `active_record:migration`. That changes the
  CLI command set (`commands/generate.ts` adds every unregistered namespace).
- `generators/rails/migration/migration-generator.ts` is a template-builder
  generator rather than the Rails `hook_for :orm` shape, so the two
  `migration` entry points have to be reconciled together.

## Acceptance criteria

- The AR migration generator lives at
  `packages/trailties/src/generators/active-record/migration/migration-generator.ts`
  beside its `templates/`, and is found as `active_record:migration`.
- `Rails::Generators::MigrationGenerator` (`rails/migration`) invokes it via
  `hookFor("orm", { required: true })` as Rails does, and the CLI `migration`
  command reaches it through that hook.
- Every import site moves in the same PR, and no re-export shim is left at the
  old path.
