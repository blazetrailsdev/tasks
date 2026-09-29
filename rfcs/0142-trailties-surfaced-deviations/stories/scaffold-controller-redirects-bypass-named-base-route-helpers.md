---
title: "Scaffold controller hand-builds redirect/location paths instead of NamedBase route helpers"
status: in-progress
updated: 2026-09-29
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 6
pr: trails#8253
claim: "2026-09-29T19:19:01Z"
assignee: "scaffold-controller-test-emits-empty-placeholders"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in trails#8217. The scaffold controller templates build their redirect and location targets through
`NamedBase`'s route helpers:

- `controller.rb.tt`: `redirect_to <%= redirect_resource_name %>` (create/update) and `redirect_to <%= index_helper %>_path` (destroy).
- `api_controller.rb.tt`: `location: <%= "@#{singular_table_name}" %>`.
- `railties/lib/rails/generators/named_base.rb:97-111`: `index_helper`, `show_helper`, `edit_helper`, `new_helper`.
- `railties/lib/rails/generators/named_base.rb:146-165`: `redirect_resource_name`, `model_resource_name` (the `options[:model_name]` arm that emits `[:admin, @user]`), `singular_route_name`.

`packages/trailties/src/generators/rails/scaffold-controller/scaffold-controller-generator.ts` (`crudMethods` /
`apiCrudMethods`) instead hand-builds `` `${routeUrl}/${record.id}` `` and `"${routeUrl}"` strings. trails'
`named-base.ts` ports none of these helpers.

## Acceptance criteria

- Port `index_helper`, `show_helper`, `edit_helper`, `new_helper`, `redirect_resource_name`, `model_resource_name`
  and `singular_route_name` into `named-base.ts`, with Rails' names, arguments and `options[:model_name]` arms.
- The scaffold controller emits its redirect and location targets through them, rendered as trails route-helper
  calls in the generated TS, instead of the hand-built path strings.
- Port `scaffold_controller_generator_test.rb`'s `test_model_name_option` redirect assertions.
