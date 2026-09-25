---
title: "Developer habtm projects_extended_by_name* use extend: where Rails uses an extending scope"
status: draft
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
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

Surfaced on trails#8073 (`has-many-block-extension-define-extensions-module`).

Rails `Developer` (`vendor/rails/activerecord/test/models/developer.rb:45-65`) declares
`projects_extended_by_name`, `projects_extended_by_name_twice` and
`projects_extended_by_name_and_block` with a scope that extends:
`-> { extending(ProjectsAssociationExtension) }` (the last one also has a `do ... end` block
defining `find_least_recent`). `ProjectsAssociationExtension2` is a module
(`developer.rb:19-23`), and `ProjectsAssociationExtension` is defined in
`test/models/project.rb`.

trails' `packages/activerecord/src/test-helpers/models/developer.ts` ports all three with
`extend: [...]` options, using plain-object `projectsAssociationExtension` /
`projectsAssociationExtension2` statics and an inline object where the block should be. So the
reflection-level `extend` path runs where Rails runs the scope-level `extending` path, and the
block does not go through `define_extensions`. trails#8073 made the has_many/habtm macros
accept the trailing extension block (`(mod: Module) => void`).

## Converged shape

- The three habtm associations take a scope `(q) => q.extending(...)` as Rails does.
- The `_and_block` association passes its `findLeastRecent` through the macro's extension block.
- The extension modules are ruby-compat `Module`s, not plain objects.
- `ProjectsAssociationExtension` lives with `Project` as it does in Rails.

## Acceptance criteria

- [ ] `developer.ts` matches `developer.rb:45-65` in scope, extending and block shape.
- [ ] The `extension_test.rb` / `has_and_belongs_to_many_associations_test.rb` cases that use these associations still pass.
