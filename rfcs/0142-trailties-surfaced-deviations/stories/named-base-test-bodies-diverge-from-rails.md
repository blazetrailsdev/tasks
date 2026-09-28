---
title: "named-base.test.ts Rails-named tests assert non-Rails bodies"
status: draft
updated: 2026-09-28
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8219. `packages/trailties/src/generators/named-base.test.ts` ports
`railties/test/generators/named_base_test.rb`, but three of its Rails-named tests carry
bodies that are not the Rails ones:

- `test_named_generator_with_underscore` (`named_base_test.rb:10-22`): Rails asserts `name`,
  `class_path`, `class_name`, `file_path`, `file_name`, `human_name` ("Line item"),
  `singular_name`, `plural_name`, `i18n_scope` and `table_name` for `line_item`. trails
  builds `admin_user` and asserts only three of these.
- `test_named_generator_attributes` (`:24-47`): Rails builds `admin/foo` and asserts the
  name, controller and route readers (`controller_class_path`, `controller_i18n_scope`,
  `singular_route_name` "admin_foo", `plural_route_name`, `model_resource_name`,
  `index_helper` "admin_foos"). trails asserts `attributes.map(name)` for `post`, which is
  not in that Rails test at all.
- `test_namespaced_scaffold_plural_names` (`:84-92`) is only partly ported.

Rails runs these through `generator [...]` on `ScaffoldControllerGenerator`
(`named_base_test.rb:8`). trails' `generator()` helper in the same file already does this.

## Acceptance criteria

- Each test listed above builds the Rails input and asserts every Rails `assert_name` line.
  For `index_helper` / `*_helper`, assert the camelized route name that trails' NamedBase
  returns (as `test_index_helper_with_uncountable` does, "sheepIndex").
- Port `test_named_generator_attributes_without_pluralized` and
  `test_namespaced_scaffold_plural_names_as_ruby` if their dependencies exist (the
  `pluralize_table_names` switch). Otherwise leave them as `it.skip` stubs that carry the
  Rails name.
