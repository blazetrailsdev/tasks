---
title: "Converge assign_parameters: thread the fetch_header block parameter into set_header"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 6356
claim: "2026-08-11T13:26:07Z"
assignee: "naming-burndown-activerecord-rest-2"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6351 (RFC 0099): the similarity pairing exposed a port
divergence the source-order zip had hidden behind a wrong pair. Baselined at
`scripts/api-compare/call-mismatches-exclude/actioncontroller/test-case.json`
(`assign_parameters` / `set_header` / `["ref:k", "ref:fullpath"]`) so the ratchet
stays green; the row exists to be deleted by this story.

Rails, `actionpack/lib/action_controller/test_case.rb:139-144`:

```ruby
fetch_header("PATH_INFO") do |k|
  set_header k, generated_path
end
fetch_header("ORIGINAL_FULLPATH") do |k|
  set_header k, fullpath
end
```

`fetch_header(name) { |k| … }` yields the KEY to the block and stores the
block's return under it; the header name reaches `set_header` as the block
parameter `k`, and `set_header` runs only when the header is absent. The port
(`packages/actionpack/src/action-controller/test-case.ts:610`, `:614`) writes
`this.setHeader("PATH_INFO", generatedPath)` / `this.setHeader("ORIGINAL_FULLPATH",
this.fullpath)` — the name is inlined and the `fetch_header` block parameter is
not threaded. Same shape at `:116` (`fetch_header("CONTENT_TYPE") { |k| set_header k, … }`,
ported at `:582`).

Worth checking whether the port also drops `fetch_header`'s absent-only
semantics, not just the block parameter: if the TS side calls `setHeader`
unconditionally it overwrites a header Rails would have left alone.

## Converged shape

`fetchHeader(name, (k) => …)` ported with its block, and the callback passing
`k` to `setHeader` exactly as Rails does — one Rails method, one TS method, the
block parameter preserved.

## Acceptance criteria

1. `assignParameters` calls `fetchHeader` with a callback that receives the key
   and passes it to `setHeader`, matching `test_case.rb:139-144` and `:116`.
2. `fetchHeader`'s absent-only semantics are verified against
   `actionpack/lib/action_dispatch/http/headers.rb` and preserved.
3. The baseline row above goes stale and is deleted by hand.
4. `pnpm parity:api:calls:args` green, row count strictly decreases.
