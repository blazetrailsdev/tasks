---
title: "Scaffold generators derive names ad hoc instead of NamedBase + ResourceHelpers"
status: draft
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8097. `ScaffoldGenerator` and `ScaffoldControllerGenerator`
(`packages/trailties/src/generators/rails/scaffold/scaffold-generator.ts:18-27`,
`rails/scaffold_controller/scaffold-controller-generator.ts:29-41`) extend
`GeneratorBase` and derive every name ad hoc (`camelize(underscore(name))`,
`tableize(className)`, `singularize(underscore(leaf))`, a hand-split `parts` array for
namespaces). Rails derives these through `NamedBase` + `ResourceHelpers`:

- `named_base.rb:175-178` `assign_names!` (class_path / file_name)
- `named_base.rb:70` `class_name`, `:74` `human_name`, `:78` `plural_name`,
  `:86-90` `table_name`, `:113` `singular_table_name`, and `plural_table_name`
- `resource_helpers.rb:31-52` `controller_class_path`, `controller_file_name`,
  `controller_class_name`, and `options[:model_name]` handling

trails already has `NamedBase` (`packages/trailties/src/generators/named-base.ts`), which
`MigrationGenerator` and `TaskGenerator` use.

## Acceptance criteria

- Both scaffold generators extend `NamedBase` and include a `ResourceHelpers` port
  (`resource_helpers.rb`), reading `className`, `singularTableName`, `pluralTableName`,
  `controllerClassName`, `controllerFileName` and `humanName` instead of recomputing them.
- The ad hoc `parts` / `nsClass` / `singularLeaf` locals are gone.
- The existing scaffold and scaffold_controller generator tests stay green.
