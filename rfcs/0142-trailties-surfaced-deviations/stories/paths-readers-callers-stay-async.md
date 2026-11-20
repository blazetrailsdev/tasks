---
title: "paths-readers-callers-stay-async"
status: draft
updated: 2026-11-20
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

# Paths readers' callers stay async after Path#expanded went sync

## Context

With `Path#expanded` synchronous (`vendor/rails/v8.0.2/railties/lib/rails/paths.rb:201-217`), several
members whose only `await` was a Paths read are now async by accident of the port, while Rails'
are synchronous:

- `Engine#helpers_paths` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb`) — `packages/trailties/lib/engine.ts` `helpersPaths`, and `Application#helpersPaths`.
- `Engine::Configuration#all_autoload_paths` / `all_autoload_once_paths` / `all_eager_load_paths` (`vendor/rails/v8.0.2/railties/lib/rails/engine/configuration.rb`) — `packages/trailties/lib/engine/configuration.ts:82-89`.
- `Rails.public_path` (`vendor/rails/v8.0.2/railties/lib/rails.rb`) — `packages/trailties/lib/trails.ts` `publicPath`.
- `Engine#load_generators`, `has_migrations?` (`engine.ts`), `Application#ensure_generator_templates_added`, `#encrypted`.

## Acceptance criteria

- Each member above is synchronous, as in Rails, and its callers drop the `await`.
- `@typescript-eslint/require-await` reports none of them.
