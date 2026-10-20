---
title: "rack parse_nested_query: empty pair reaches _normalize_params, no invented skip"
status: ready
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
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

Rails `vendor/rack/v3.1.14/lib/rack/query_parser.rb:99-111` `parse_nested_query` does not skip an empty pair. For `"a=1&&b=2"`, `"".split('=', 2)` is `[]`, so `k` and `v` are `nil` and `_normalize_params(params, nil, nil, 0)` runs. Only `parse_query` (`:76-77`) has `next if p.empty?`. The port `packages/rack/src/query-parser.ts` `parseNestedQuery` has an invented `if (!p) continue;`. Its split is also open-coded with `indexOf`, where Rails uses `p.split('=', 2)`. `parseQuery` uses the same open-coded split.

## Acceptance criteria

- [ ] `parseNestedQuery` drops the empty-pair guard and passes `nil` k/v through to `_normalizeParams`, as Rails does. Port any Rails spec that covers `&&`.
- [ ] `parseQuery`'s split matches `p.split('=', 2).map!(&unescaper)` (`:78`).
