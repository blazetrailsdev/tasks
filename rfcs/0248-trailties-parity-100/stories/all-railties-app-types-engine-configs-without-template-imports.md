---
title: "trailties/all carries the engine config types; drop application.ts.tt's import type lines"
status: draft
updated: 2026-11-22
rfc: "0248-trailties-parity-100"
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

Rails' `rails/all.rb` (`vendor/rails/v8.0.2/railties/lib/rails/all.rb:5-21`) requires every railtie, and a generated app's `require "rails/all"` (`app_base.rb:299-313`, `include_all_railties?`) is the whole statement. trails' `packages/trailties/lib/all.ts` loads `@blazetrails/activestorage/engine`, `actionmailbox/engine`, `actiontext/engine` and `actioncable/engine` through computed `import()`s (trailties cannot import them statically: each depends on trailties, so a static edge is a build cycle). Their `declare module "@blazetrails/trailties/trailtie/configuration"` augmentations (`activestorage/lib/engine.ts:69-79` and siblings) therefore never reach a generated app's type program, and `this.config.activeStorage.service = "local"` in `config/environments/*.ts` fails TS2339.

trails#10538 worked around it in `lib/generators/trails/app/templates/config/application.ts.tt`: in the `includeAllRailties()` branch it emits one `import type {} from "<engine>"` line per package engine, a line Rails' template does not have.

## Acceptance criteria

- A generated all-railties app type-checks its environment files with `config/application.ts` holding only `import "@blazetrails/trailties/all";`, as Rails' template holds only `require "rails/all"` (e.g. `all.ts` re-exports the engines' config types from a types-only entry that has no build-time edge, or the augmentations move to a package trailties already references).
- The `import type {}` loop in `application.ts.tt` and its snapshot lines are removed.
- `scaffold-generator.trails.test.ts` "emits a controller that trails-tsc builds against the scaffolded model" stays green.
