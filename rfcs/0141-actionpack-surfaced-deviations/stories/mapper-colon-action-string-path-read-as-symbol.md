---
title: 'Mapper reads a ":action" path string as the Symbol :action'
status: draft
updated: 2026-10-15
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails draws `post ":action", to: Controller` in `json_params_parsing_test.rb:117` and
`url_encoded_params_parsing_test.rb:121` (`vendor/rails/v8.0.2/actionpack/test/dispatch/request/`).
In trails that is a String path, but a leading-colon string is also the port of a Ruby Symbol, so
`this.post(":action", …)` is read as `post :action` and the route does not match `/parse`. The ports in
trails#8936 (`dispatch/request/json-params-parsing.test.ts`, `url-encoded-params-parsing.test.ts`)
draw `"/:action"` instead.

## Acceptance criteria

- The Mapper tells a `":action"` path string apart from the Symbol `:action` the way Rails' `match` does
  (`action_dispatch/routing/mapper.rb`, `path_for_action` / `map_match`), or the route is otherwise drawn
  with Rails' literal `":action"`.
- Both test files draw `":action"`, as Rails does.
