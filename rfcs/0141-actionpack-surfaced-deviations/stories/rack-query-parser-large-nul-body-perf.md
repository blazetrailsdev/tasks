---
title: "rack-query-parser-large-nul-body-perf"
status: ready
updated: 2026-10-22
rfc: "0141-actionpack-surfaced-deviations"
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

`spec_request.rb:1887-1901` runs `handles ASCII NUL input of #{length} bytes` for 2**24..2**27. `packages/rack/src/request.test.ts` runs only 2**24 (trails#9154), because parsing a 16MB urlencoded body of NULs through `Request#POST` → `QueryParser#parseNestedQuery` takes ~11s (2**20: ~0.8s, linear). The 2**25..2**27 lengths would take 20-90s each. MRI parses all four in well under a second.

## Acceptance criteria

- [ ] Profile `QueryParser#parse_nested_query` / `Utils.unescape` on a 2\*\*24 NUL body and remove the per-byte overhead (no behavior change).
- [ ] `handles ASCII NUL input of  bytes` runs Rails' four lengths (2**24..2**27) within the default timeout, and the 60s timeout override is removed.
