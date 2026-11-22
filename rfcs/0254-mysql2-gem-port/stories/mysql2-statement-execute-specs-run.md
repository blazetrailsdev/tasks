---
title: "mysql2 statement_spec execute/bind/last_id skips run"
status: done
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: ["mysql2"]
deps: []
deps-rfc: []
est-loc: 250
priority: 3
pr: trails#10595
claim: "2026-11-22T20:34:04Z"
assignee: "mysql2-statement-result-each-reads-its-cast-options-per-call"
blocked-by: null
closed-reason: null
---

## Context

The gem specs are fully enrolled (`packages/mysql2/test/{client,error,result,statement}.test.ts` carry all 276 `it` names), but 183 are `it.skip`. For mysql2 to reach 100% test parity every skip must either run or carry a skip reason that is a genuine Node/JS impossibility (CLAUDE.md "Runtime facts Node does not expose", "A String has no encoding tag either"). The skips below cite "not in the RFC 0254 surface table" or an RFC 0254 Non-goal; that is a scope choice, not an impossibility, and this story retires it. Where porting a spec needs gem surface the package does not ship yet, port that surface (Ruby half scored by parity:api, C half under its gem name, no receipt). Where a spec is genuinely unportable after investigation, keep the skip but replace its comment with the concrete Node/driver fact, and say so in the PR.

`statement.test.ts` top-level/execute skips ("not in the RFC 0254 surface table", 18): should handle booleans; bignum in int64_t; bignum beyond int64_t; keyword arguments on execute; bind + keyword arguments; keep its result after other query; reusable 1000 / 10000 times; comparisons and likes; select dates; prepare Date values; prepare Time values with microseconds; prepare DateTime values with microseconds; tell us about the fields; decimal binding a BigDecimal; update a DECIMAL passing a BigDecimal; last_id "should return last insert id"; "should handle bigint ids".

`Statement#execute` is `packages/mysql2/lib/statement.ts`; `last_id` on a statement is C-defined (`ext/mysql2/statement.c`).

## Acceptance criteria

- [ ] The listed `it.skip`s in `packages/mysql2/test/statement.test.ts` run and pass, ported from `vendor/mysql2/0.5.6/spec/mysql2/statement_spec.rb`; `Statement#last_id` is added under its gem name if missing.
- [ ] Any that cannot run keep a skip whose comment names the concrete Node/driver fact.
