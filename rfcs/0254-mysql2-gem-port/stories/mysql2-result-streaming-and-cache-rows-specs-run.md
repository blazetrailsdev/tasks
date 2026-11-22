---
title: "mysql2 streaming and cache_rows specs run"
status: ready
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: ["mysql2"]
deps: []
deps-rfc: []
est-loc: 300
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The gem specs are fully enrolled (`packages/mysql2/test/{client,error,result,statement}.test.ts` carry all 276 `it` names), but 183 are `it.skip`. For mysql2 to reach 100% test parity every skip must either run or carry a skip reason that is a genuine Node/JS impossibility (CLAUDE.md "Runtime facts Node does not expose", "A String has no encoding tag either"). The skips below cite "not in the RFC 0254 surface table" or an RFC 0254 Non-goal; that is a scope choice, not an impossibility, and this story retires it. Where porting a spec needs gem surface the package does not ship yet, port that surface (Ruby half scored by parity:api, C half under its gem name, no receipt). Where a spec is genuinely unportable after investigation, keep the skip but replace its comment with the concrete Node/driver fact, and say so in the PR.

Skips citing "streaming, cache_rows and async_result are outside the RFC 0254 surface" plus the `cache_rows` cases citing the surface table (19): `result.test.ts` "#each" (cache by default, no cache when cache_rows disabled, iterate twice with cache_rows disabled, #first when streaming / not streaming, iterate twice when streaming) and "streaming" (5: count while streaming, count mixing first/each, no nil at end, zero count, timeout); `statement.test.ts` "#each" (4), "streaming result" (1), "should warn but still work if cache_rows is set to false"; `client.test.ts` streaming query-again cases (2).

Related: 0189 `mysql2-result-rows-are-typed-as-arrays-and-cache-rows-is-unread` — coordinate, do not duplicate.

## Acceptance criteria

- [ ] `stream: true` and `cache_rows: false` are honored by `Result#each` (over `mysql2`'s row stream), and the listed skips run and pass.
- [ ] Any that cannot run keep a skip whose comment names the concrete Node/driver fact.
