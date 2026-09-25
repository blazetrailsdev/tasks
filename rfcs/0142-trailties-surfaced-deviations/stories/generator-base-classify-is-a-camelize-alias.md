---
title: "generators/base.ts classify is a camelize alias; Rails' .classify call sites lose singularization"
status: in-progress
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 4
pr: trails#8097
claim: "2026-09-25T17:31:41Z"
assignee: "widen-relation-merge-hash-overload"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/base.ts:122` exports
`classify(name) = camelize(name.replace(/-/g, "_"))`. Despite the name, it is a camelize and
never singularizes. Rails' `String#classify` (`activesupport/lib/active_support/inflector/methods.rb`,
`classify`) is `camelize(singularize(table_name.to_s.delete_suffix(...)))`.

Generator call sites use this one name for two different Rails methods:

- Where Rails calls real `classify`, trails gets no singularization. Example:
  `parentRefForRelative` in `generators/rails/controller/controller-paths.ts` ports
  `parent_class_name.classify` (`railties/lib/rails/generators/rails/controller/templates/controller.rb.tt:2`),
  so `--parent=admin_bases` yields `AdminBases` where Rails yields `AdminBasis`/`AdminBase`.
- Where Rails calls `camelize` (`named_base.rb:70` `class_name`), the scaffold, scaffold_controller,
  model and migration generators call `classify` and get the right answer by accident.
  trails#8084 moved the controller and helper generators onto `camelize(underscore(p))`.

## Acceptance criteria

- `generators/base.ts`'s `classify` is removed.
- Each call site uses the Rails method its template names: `camelize` (after `underscore`, as
  `assign_names!` at `named_base.rb:175-178` does) for `class_name`-derived names, and
  activesupport's real `classify` where the Rails template calls `.classify`.
- A generator test covers `--parent` with a plural name.
