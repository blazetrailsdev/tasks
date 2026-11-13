---
title: "burn-down-the-declaration-only-population-remaining"
status: draft
updated: 2026-11-13
rfc: "0156-parity-beyond-name-presence"
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

The rest of `burn-down-the-declaration-only-population` once trails#10055 lands. That PR converged the activesupport rows: `logger_thread_safe_level.rb` (stale `RUBY_FILE_TS_OVERRIDES` row), `Callbacks::Filters::Environment` (now a `Struct.new`), and both `SerializerWithFallback` files (nested modules at their Ruby names). These 15 `[declaration-only]` rows remain, reproduced by `pnpm parity:api --package <pkg> --missing`:

- actiontext `rendering.rb` → `rendering.ts`: `Rendering#render`, `#action_controller_renderer`, `#with_renderer`, `#renderer`, `#renderer=`
- trailties `generators/migration.rb` → `generators/migration.ts`: `#migration_number`, `#migration_class_name`. These are `attr_reader`s (`vendor/rails/v8.0.2/railties/lib/rails/generators/migration.rb:13`) that trails declares only as `MigrationTemplateHost` interface fields.
- trailties `generators/resource_helpers.rb` → `generators/resource-helpers.ts`: `#controller_name`, `#controller_file_name`. These are `attr_reader`s (`vendor/rails/v8.0.2/railties/lib/rails/generators/resource_helpers.rb:29`), declared only as `ResourceHelpersHost` fields.
- mysql2 `client.rb` → `client.ts`: `Client#query_options`, `#read_timeout`
- pg `pg.rb` → `pg.ts`: `PG.connect`
- nokogiri `xml/node.rb` → `xml/node.ts`: `Node#value?`
- solid-queue `configuration.rb` → `configuration.ts`: `Process#attributes=`
- mail `utilities.rb` → `utilities.ts`: `StrictCharsetEncoder#encode`

Patterns from trails#10055 that recur here:

- a stale file override in `scripts/parity/conventions.ts`;
- a module held in a non-exported lowercase const, which the extractor cannot see (export it at the Ruby name and seat it on its Ruby owner);
- a Ruby `Struct` ported as an interface.

Run `pnpm parity:class-paths` after any change that gives a constant a new path.

## Acceptance criteria

- Each row above has its body in the mirror file at the Rails name, and `pnpm parity:api --package <pkg> --missing` shows no `[declaration-only]` row for it.
- No baseline row, `@noRailsEquivalent` tag, or `SKIP_GROUPS` entry is added to make a row disappear.
