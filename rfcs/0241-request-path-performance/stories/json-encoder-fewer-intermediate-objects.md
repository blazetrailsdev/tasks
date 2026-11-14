---
title: "JSON encoding allocates fewer intermediate objects per render"
status: ready
updated: 2026-11-14
rfc: "0241-request-path-performance"
cluster: request-perf
packages: [activesupport]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`render json:` passes through `ActiveSupport::JSON::Encoding::JSONGemEncoder`
(`packages/activesupport/lib/json/encoding.ts`). `jsonify` rebuilds every
object with `Object.entries` plus a fresh result object at each level, then
`JSON.stringify` walks the copy again. On `GET /feed`, which serialises 20
posts, encoding carries **about 18%** of all bytes allocated per request
(inclusive). `Object.entries` inside `jsonify` alone is 1.4%. The
`asJson` dispatch in `core-ext/object/json.ts` adds the attribute reads (`get`
in `attribute-methods/read`, 4.5%). Rails does the same two passes
(`jsonify`, then `JSON.generate`), so the result must keep Rails' output
byte for byte.

## Acceptance criteria

- Plain objects, arrays and `Map`s whose leaves are already JSON-native are
  encoded without building a mirror tree. For example, `jsonify` returns its
  input when nothing changes, or `stringify` is given a replacer.
- Output stays byte-identical. Existing `encoding` and `as_json` tests stay
  green, and new tests cover nested plain objects, `Map`, and values with
  `asJson`.
- Allocated bytes per `/feed` request fall measurably, recorded with the
  sampling heap profiler.
