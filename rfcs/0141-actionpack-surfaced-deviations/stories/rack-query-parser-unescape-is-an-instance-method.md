---
title: "Rack::QueryParser#unescape is a module-private function, not an instance method"
status: draft
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::QueryParser#unescape(string, encoding = Encoding::UTF_8)` is a public
instance method (`vendor/rack/v3.1.14/lib/rack/query_parser.rb:234-236`), and
`parse_query` / `parse_nested_query` call it on `self`, so a subclass can override it.
trails ports it as a module-private function `unescape` in
`packages/rack/src/query-parser.ts`, which `parseQuery` / `parseNestedQuery` call
directly. Since trails#9827 its body is `URI.decodeWwwFormComponent(string, encoding)`,
so it is correct, but it is not a member of `QueryParser`.

## Acceptance criteria

- `QueryParser#unescape(string, encoding = Encoding.UTF_8)` is an instance method
  with the Rails body, and the module-private function is deleted.
- `parseQuery` and `parseNestedQuery` call `this.unescape(...)` as `query_parser.rb` does.
- `parity:api` credits `unescape` on `query_parser.rb`, and the call gates stay green.
