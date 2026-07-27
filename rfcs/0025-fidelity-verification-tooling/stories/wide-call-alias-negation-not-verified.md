---
title: "Wide call ratchet credits negating aliases (none?/exclude?) without checking the negation"
status: done
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 19
pr: 5428
claim: "2026-07-27T17:31:14Z"
assignee: "wide-call-alias-negation-not-verified"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of #5242. `jsEnumerableAliases` entries whose Ruby name is a
NEGATION are matched by call-name presence only — `compare.ts` does
`aliasCall(rc).some((c) => tsCalls.has(c))`, with no check for a leading `!`.

So `exclude? → ["includes", "has"]` (added in #5242) is satisfied by a bare
`xs.includes(y)` just as well as the faithful `!xs.includes(y)`. Same for the
pre-existing `none? → ["some", "every"]`. This is not a regression introduced
by PR #5242 — it is how every entry in the map has always worked — but it means the
wide ratchet credits a port that inverted the condition.

Both current `exclude?` convergences are genuinely negated
(`database-statements.ts` `!ACTIONABLE_LEVELS.has(...)` for Rails
`database_statements.rb:226`; `query-methods.ts:1848` `!VALID_DIRECTIONS.has(...)`
for Rails `query_methods.rb:2069`), so nothing is wrong today — this is about
the ratchet's precision, not a live defect.

## Acceptance criteria

- [ ] Determine whether the TS extractor can record that a call appeared under
      a `!` / in a negated position at all (`extract-ts-api.ts`) — this is the
      prerequisite and may itself be the bulk of the work.
- [ ] If feasible, mark the negating entries (`none?`, `exclude?`) in
      `JS_ENUMERABLE_ALIASES` and require the negated form for them.
- [ ] If not feasible, say so in the module docstring so the limitation is
      recorded once rather than re-litigated per entry.
- [ ] No new wide-ratchet entries; `pnpm api:calls:wide` green.
