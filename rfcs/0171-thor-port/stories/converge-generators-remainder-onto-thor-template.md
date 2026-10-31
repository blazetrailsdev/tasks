---
title: "converge-generators-remainder-onto-thor-template"
status: ready
updated: 2026-10-31
rfc: "0171-thor-port"
cluster: null
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 900
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`converge-remaining-generators-onto-thor-template` converted the small generators (benchmark, controller, helper, job, script, test-unit/\*, tse/controller) and hit the PR ceiling. These still build bodies in TS where Rails calls `template`:

- `packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts` (`createControllerFiles`; `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/scaffold_controller/scaffold_controller_generator.rb`)
- `packages/trailties/src/generators/rails/devcontainer/devcontainer-generator.ts` (`createDevcontainer`, `updateDatabaseYml`; `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/devcontainer/devcontainer_generator.rb`)
- The in-memory `template` overrides in `app-generator.ts`, `rails/db/system/change/change-generator.ts` (`change_generator.rb:36-38`) and both `authentication-generator.ts` files, over `rails/app/templates/index.ts`, `rails/authentication/templates.ts`, `tse/authentication/templates.ts`.

`build:templates` already copies every non-TS file under `src/generators`, so a new `templates/` directory needs no package.json edit.

Files this story touches:

- `packages/trailties/src/generators/app-generator.ts`
- `packages/trailties/src/generators/rails/db/system/change/change-generator.ts`
- `packages/trailties/src/generators/rails/authentication/authentication-generator.ts`
- `packages/trailties/src/generators/tse/authentication/authentication-generator.ts`
- `packages/trailties/src/generators/rails/controller/controller-generator.ts`
- `packages/trailties/src/generators/rails/job/job-generator.ts`
- `packages/trailties/src/generators/test-unit/controller/controller-generator.ts`

## Acceptance criteria

- [ ] Each generator carrying a `CONVERGEABLE converge-generators-remainder-onto-thor-template` receipt calls Thor's `template` over a source file in its `templates/` directory, and the receipt is removed.
- [ ] The in-memory `template` overrides in `app-generator.ts`, `change-generator.ts` and both authentication generators are deleted, with their `TEMPLATES` tables.
- [ ] The `CONVERGEABLE converge-generators-remainder-onto-thor-template` `@noRailsEquivalent` helpers on `rails/controller/controller-generator.ts`, `rails/job/job-generator.ts` and `test-unit/controller/controller-generator.ts` (`parentRef`, `parentClass`, `parentPath`, `controllerClassName`, `paths`, `importPrefix`) are gone, inlined into the `.tt` as Rails does (`controller_generator.rb:28-30`): `.tt` files reach `classify` and the import path without a generator member, as `controller.rb.tt:2` reads `parent_class_name.classify` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/controller/templates/controller.rb.tt`).
