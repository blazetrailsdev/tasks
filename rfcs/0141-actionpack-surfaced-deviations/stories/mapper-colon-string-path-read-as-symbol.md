---
title: "Mapper reads a ':action' String path as a Symbol and draws a static route"
status: draft
updated: 2026-10-14
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
`post ":action", controller: "x/test"` (as in
`actionpack/test/dispatch/request/multipart_params_parsing_test.rb:162,166`)
draws `/:action(.:format)` with a dynamic `:action` segment.

In trails a colon-leading string is the Ruby Symbol convention, so
`this.post(":action", ...)` is read as the Symbol `:action` and draws a static
`/action(.:format)` route with `action: "action"`. trails#8914 had to write
`"/:action"` in the multipart test.

## Acceptance criteria

- Decide, per the Mapper's Rails arms (`match` path-vs-Symbol handling), how a
  String path starting with `:` is told apart from a Symbol, and converge so
  `post(":action", { controller })` draws the dynamic segment Rails draws.
- `multipart-params-parsing.test.ts` routes revert to `":action"`.
