---
title: "Mapper reads a ':action' String path as a Symbol and draws a static route"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' mapper normalizes a route path string with `Mapper.normalize_path`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb`), so
`post ":action", …` draws `/:action(.:format)` with a dynamic `:action` segment. Rails'
tests draw it that way in
`vendor/rails/v8.0.2/actionpack/test/dispatch/request/multipart_params_parsing_test.rb:162,166`,
`json_params_parsing_test.rb:117`, `url_encoded_params_parsing_test.rb:121` and
`query_string_parsing_test.rb`.

In trails a colon-leading string is the Ruby Symbol convention, so `this.post(":action", …)`
is read as the Symbol `:action` and draws a static `/action(.:format)` route with
`action: "action"`. The ports draw `"/:action"` instead:

- `dispatch/request/multipart-params-parsing.test.ts:101,251` (trails#8914)
- `dispatch/request/json-params-parsing.test.ts:144,277` (trails#8936)
- `dispatch/request/url-encoded-params-parsing.test.ts:158` (trails#8936)
- `dispatch/request/query-string-parsing.test.ts:63,194`

(Merged from the duplicate `mapper-colon-action-string-path-read-as-symbol`.)

## Acceptance criteria

- Decide, per the Mapper's Rails arms (`match` / `map_match` / `path_for_action`
  path-vs-Symbol handling), how a String path starting with `:` is told apart from a Symbol
  at the call sites where Rails' argument is a path, and converge so `post(":action", …)`
  draws the dynamic segment Rails draws. If the two cannot be told apart at the Mapper's
  signature, record that decision and the spelling callers use.
- The four test files draw `":action"`, as Rails does.
