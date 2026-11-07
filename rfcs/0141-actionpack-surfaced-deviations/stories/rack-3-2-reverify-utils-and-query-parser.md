---
title: "rack-3-2-reverify-utils-and-query-parser"
status: in-progress
updated: 2026-11-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9831
claim: "2026-11-07T14:01:44Z"
assignee: "rack-3-2-reverify-utils-and-query-parser"
blocked-by: null
closed-reason: null
---

## Context

`bump-vendored-rack-anchor-to-3-2` moved the rack anchor to `v3.2.8` and re-pinned these bodies without re-verifying the TS ports. Ruby: `vendor/rack/v3.2.8/lib/rack/utils.rb` and `query_parser.rb`. TS: `packages/rack/src/utils.ts`, `packages/rack/src/query-parser.ts`.

Drifted: `Utils.byte_ranges`, `get_byte_ranges`, `forwarded_values`, `select_best_encoding`, `set_cookie_header`, `status_code`; `QueryParser#parse_query` (:73), `#parse_nested_query` (:109). New: `QueryParser#parse_query_pairs` (:94), which `Request#form_pairs` reads. Removed: `QueryParser#check_query_string` (pin pruned).

## Acceptance criteria

- Each listed method mirrors its v3.2.8 body; `parseQueryPairs` is ported.
- A TS `checkQueryString` with no remaining Rails caller is removed.
