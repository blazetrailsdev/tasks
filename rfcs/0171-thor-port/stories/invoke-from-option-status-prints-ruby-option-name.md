---
title: "invoke_from_option's status line prints the camelCase option key, not Rails' option name"
status: ready
updated: 2026-10-29
rfc: "0171-thor-port"
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

`Thor::Group.invoke_from_option` (`vendor/thor/v1.3.2/lib/thor/group.rb:111-141`) does
`value = name if TrueClass === value` and then `say_status :invoke, value, verbose`. In Ruby
`name` is the option Symbol (`:resource_route`), so a Rails scaffold prints
`invoke  resource_route` and looks up `find_by_namespace("resource_route", ...)`.

trails names class options in camelCase (`resourceRoute`, per the option-key convention), so
`packages/thor/src/group.ts`'s `invokeFromOption` prints `invoke  resourceRoute`. This was seen in
`trails destroy scaffold` output after trails#9399. Lookup still resolves, but only because
`Generators.findByNamespace` folds input to kebab-case (`packages/trailties/src/generators.ts`).

## Converged shape

The `true` arm yields the Ruby option's name, i.e. the snake_case spelling of the camelCase
option key (`resource_route`), at the one site where `value = name`. Every caller then sees
Rails' value: `say_status`, `prepare_for_invocation` and `find_by_namespace`.

## Acceptance criteria

- [ ] `rails g scaffold Post` and `rails destroy scaffold Post` print `invoke  resource_route`, as Rails does.
- [ ] A `packages/thor/src/group.trails.test.ts` case asserts the status line for a boolean
      `invokeFromOption` option whose name is multi-word.
