---
title: "GeneratorBase carries @inlinedFrom Thor::Actions#initialize; inlined gate pairs it"
status: draft
updated: 2026-11-05
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

`Rails::Generators::Base` includes `Thor::Actions` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb`), whose `initialize` is `vendor/thor/v1.3.2/lib/thor/actions.rb:72-85`. trails runs that body in `Thor`'s/`Group`'s constructor behind `isModuleIncluded(new.target, Actions)` (`packages/thor/src/thor.ts:717-732`). CLAUDE.md § "A module installed at run time is inlined behind a guard" requires the includer's constructor to carry `@inlinedFrom Thor::Actions#initialize`.

`pnpm parity:api:inlined` (`scripts/api-compare/lint-inlined-from.ts`, the `counterpart` lookup) never pairs `packages/trailties/src/generators/base.ts`'s `GeneratorBase` with `Rails::Generators::Base`, because the short names differ (`GeneratorBase` vs `Base`) and the file declares more than one class. So the missing tag goes unreported. trails#9741 found this when `Rails::Command::App::UpdateCommand` (correctly paired) went red for the same include.

## Acceptance criteria

- The gate pairs `GeneratorBase` with `Rails::Generators::Base` (via the compare.ts pairing or a rename to Rails' `Base`), and `GeneratorBase`'s constructor carries `@inlinedFrom Thor::Actions#initialize thor/v1.3.2/lib/thor/actions.rb:72-85`.
- Every other trailties class that includes `Thor::Actions` and escapes pairing the same way is found and tagged.
