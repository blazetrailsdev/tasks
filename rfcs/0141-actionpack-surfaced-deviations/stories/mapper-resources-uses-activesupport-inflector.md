---
title: "Mapper#resources singularizes through the ActiveSupport inflector"
status: ready
updated: 2026-09-27
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/routing/mapper.ts` defines module-private
`singularize` / `pluralize` helpers (bottom of file, ~`:2234-2248`) that apply four
suffix rules. `Mapper#resources` / `#resource` use them for `memberName`,
`nestedParam`, the `new_` / `edit_` / show route names and the singleton
controller.

Rails reads the ActiveSupport inflector:

- `Resource#singular` — `name.to_s.singularize`
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:1228-1230`)
- `SingletonResource#plural` — `name.to_s.pluralize` (`mapper.rb:1298-1300`)
- `Resource#collection_name` compares the two (`mapper.rb:1236-1238`), which
  trails#8196 converged. With the hand-rolled rules, `resources :people` gives
  singular `people` (Rails: `person`), so `collection_name` wrongly becomes
  `people_index` and the member routes are named `people` / `edit_people`.
  `resources :mice`, `:octopi` and every irregular/uncountable other than
  suffix-coincidences diverge the same way.

## Acceptance criteria

- The local `singularize` / `pluralize` helpers in `mapper.ts` are deleted and
  both call sites use `@blazetrails/activesupport`'s inflector `singularize` /
  `pluralize` (the port of `String#singularize` / `#pluralize`).
- A test draws `resources :people` and asserts `person_path` / `people_path`
  exist and `fromRequirements({ controller: "people", action: "index" }).name`
  is `"people"`.
