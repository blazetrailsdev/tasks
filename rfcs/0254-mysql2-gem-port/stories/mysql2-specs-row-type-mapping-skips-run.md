---
title: "mysql2 result/statement row-type-mapping specs run (BIT, DECIMAL, DATE, out-of-range Time, BINARY)"
status: done
updated: 2026-11-22
rfc: "0254-mysql2-gem-port"
cluster: null
packages: ["mysql2"]
deps: []
deps-rfc: []
est-loc: 250
priority: 2
pr: trails#10595
claim: "2026-11-22T20:34:04Z"
assignee: "mysql2-statement-result-each-reads-its-cast-options-per-call"
blocked-by: null
closed-reason: null
---

## Context

The gem specs are fully enrolled (`packages/mysql2/test/{client,error,result,statement}.test.ts` carry all 276 `it` names), but 183 are `it.skip`. For mysql2 to reach 100% test parity every skip must either run or carry a skip reason that is a genuine Node/JS impossibility (CLAUDE.md "Runtime facts Node does not expose", "A String has no encoding tag either"). The skips below cite "not in the RFC 0254 surface table" or an RFC 0254 Non-goal; that is a scope choice, not an impossibility, and this story retires it. Where porting a spec needs gem surface the package does not ship yet, port that surface (Ruby half scored by parity:api, C half under its gem name, no receipt). Where a spec is genuinely unportable after investigation, keep the skip but replace its comment with the concrete Node/driver fact, and say so in the PR.

Row-type mapping skips (identical cases in `result.test.ts` "row data type mapping" and `statement.test.ts` "row data type mapping", 12 each = 24), all "PERMANENT-SKIP: not in the RFC 0254 surface table":

- should return String for a BIT(64) value / BIT(1) value
- cast_booleans: TrueClass/FalseClass for TINYINT and for BIT(1)
- should return BigDecimal for a DECIMAL value
- should return Time when timestamp is < 1901-12-13 20:45:52 / > 2038-01-19T03:14:07
- should return Date for a DATE value
- should raise an error given an invalid DATETIME
- should return String for a BINARY value; should return a String for #{type} (blob/text family)

The cast table lives in `packages/mysql2/lib/client.ts` (`typeCast` / `cast`) and `result.ts`; `BigDecimal` comes from `@blazetrails/ruby-compat`, dates from `@blazetrails/date`.

## Acceptance criteria

- [ ] The 24 listed `it.skip`s in `result.test.ts` and `statement.test.ts` run and pass on the MariaDB lane, ported from `vendor/mysql2/0.5.6/spec/mysql2/{result,statement}_spec.rb`.
- [ ] Any that cannot run keep a skip whose comment names the concrete Node/driver fact.
