---
title: "Correct the find_target first wide-ratchet reason citation"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 2
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already moot: RFC 0084 folded the wide ratchet into parity:api:calls and call-mismatches-wide-exclude/activerecord/ no longer exists, so the singular-association.json reason string the story rewords is gone; doc-only either way."
---

## Context

PR #5360 added a wide call-set ratchet baseline entry at

`scripts/api-compare/call-mismatches-wide-exclude/activerecord/associations/singular-association.json`

for `find_target` → `first`. The entry's substance is correct: Rails'
`super.then(&:first)` (`singular_association.rb:53`) is `Array#first` over the
array `Association#find_target` has already loaded, not `Relation#first`, and
the `take()` (unordered `LIMIT 1`) in our `findTarget` is the SQL-level
equivalent — `Relation#first` would route through `ordered_relation` and add the
`ORDER BY` that `has_one_associations_test`
`test_has_one_does_not_use_order_by` forbids.

The final sentence of the `reason` string, however, cites the wrong helper. It
says the statement-cache branch's literal `.first()` lives in
`_loadSingularViaStatementCache` (`associations.ts`). It does not:
`_loadSingularViaStatementCache` ends with `records[0] ?? null`, which is an
even more literal `Array#first`. The `.first()` call actually lives in
`_loadSingularThroughViaDisableJoinsScope` (`associations.ts:~1332`), which is
the `disable_joins` branch of `find_target` — a genuinely _ordered_ load, and
correctly so per that helper's own comment.

Left as-is, the baseline reason mis-teaches the next agent who reads it about
which path satisfies the call and about the Array-vs-Relation `first`
distinction, in a file whose whole purpose is to carry justifications forward.

## Acceptance criteria

- The `reason` string in
  `call-mismatches-wide-exclude/activerecord/associations/singular-association.json`
  cites `records[0] ?? null` in `_loadSingularViaStatementCache` as the
  `Array#first` equivalent, and stops attributing a `.first()` call to that
  helper.
- `pnpm exec tsx scripts/api-compare/compare.ts --wide-calls` followed by
  `pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts` stays green
  (the entry must remain live, not stale).
- No behavior change; JSON-only edit.
