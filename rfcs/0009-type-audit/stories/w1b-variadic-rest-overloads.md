---
title: "W1b — variadic rest overloads (drop relation.ts as-any spreads)"
status: done
updated: 2026-06-07
rfc: "0009-type-audit"
cluster: type-cleanup
deps: []
deps-rfc: []
est-loc: 100
priority: 50
pr: 2985
claim: "2026-06-06T23:54:01Z"
assignee: "w1b-variadic-rest-overloads"
blocked-by: null
---

## Context

TypeScript can't preserve rest-parameter tuple shape across reassignment, so code
uses `args as any` to spread back through (P5). `relation.ts:830,949` still do
`...(args as any)` for `orderBang` / `reorderBang`. Declare overloads on the
receiving methods so the call doesn't need the cast — same technique as the
`normalizes()` fix (#1482).

See RFC 0009 §Pattern taxonomy (P5) and §Wave 1.

## Acceptance criteria

- [ ] Overloads declared on the receiving methods (start with relation.ts hot
      paths)
- [ ] `...(args as any)` casts dropped at `relation.ts:830,949`
- [ ] No behavior change; type-audit `as any` count drops accordingly

## Notes

From the type-audit plan (W1b, ~100 LOC, low risk). Re-run
`pnpm tsx scripts/type-audit/audit.ts` after to update the trendline.
