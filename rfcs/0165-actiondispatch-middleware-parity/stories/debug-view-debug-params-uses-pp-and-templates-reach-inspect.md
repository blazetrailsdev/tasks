---
title: "debug-view-debug-params-uses-pp-and-templates-reach-inspect"
status: draft
updated: 2026-10-16
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DebugView#debug_params` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/debug_view.rb:24-34`)
formats with `PP.pp(clean_params, +"", 200)`. trails' `debugParams`
(`packages/actionpack/src/action-dispatch/middleware/debug-view.ts`) uses a module-private
`prettyPrint` (rbInspect, falling back to `JSON.stringify`), because ruby-compat's
`PP.pp` is async and a compiled TSE template body is sync.

The ported rescue templates also cannot reach Ruby core-ext calls from a template body
(templates evaluate at global scope with `TopLevel`, `this` and locals only):
`routing_error.{html,text}.tse` spell `route.inspect` as `String(route)`, and
`_request_and_response.text.tse` spells `clean_params.inspect.gsub(",", ",\n")` through
`debugHeaders`.

## Acceptance criteria

- `debugParams` calls `PP.pp(cleanParams, "", 200)` (a sync PP or a sync entry point), and `prettyPrint` is deleted.
- `routing_error.*.tse` call Ruby `inspect` on the route; `_request_and_response.text.tse` mirrors its `inspect.gsub` line.
- "show formatted params" in `dispatch/debug-exceptions.test.ts` asserts `CGI.escapeHTML(PP.pp(params, +"", 200))` as `debug_exceptions_test.rb:462` does.
