---
title: "Burn down the +2470 wide-ratchet entries baselined by #5334"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
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

PR #5334 (partially-qualified include resolution) forced a regeneration of the
wide-call ratchet via `pnpm tsx scripts/api-compare/lint-call-mismatches-wide.ts --write`,
because the newly-visible mixin methods bring their Rails call sites with them.

The regeneration was **+2470 net new baselined entries** across 16 files
(`scripts/api-compare/call-mismatches-wide-exclude/`, 2690 insertions / 219
deletions; total baselined went to 5436). Concentrated in
`activerecord/connection-adapters/{postgresql,sqlite3,abstract-mysql,mysql2}-adapter.json`,
`activerecord/{base,relation,attribute-methods,result,schema-dumper}.json`,
`connection-adapters/abstract/{schema-definitions,schema-statements}.json`,
`tasks/database-tasks.json`, `migration/join-table.json`, and three
`activemodel/type/*.json`.

That was mechanically correct and unblocked the merge, but it is a one-shot
ratchet expansion, not convergence: each entry is a call Rails makes inside a
method trails has ported, that the TS body does not make. They were invisible
before only because the mixin was invisible. Baselining them wholesale means
they will sit unexamined indefinitely — exactly the debt the ratchet is
supposed to prevent from growing silently.

The 219 deletions in the same regeneration also want a look: entries that
disappeared may indicate call sites that were re-attributed to a different host
rather than genuinely fixed.

## Acceptance criteria

- Diff the ratchet regeneration in #5334 (`git show` the merge commit's
  `call-mismatches-wide-exclude/` changes) and bucket the ~2470 additions by
  host file and by called method.
- Identify the clusters that represent a real dropped call in a ported TS body
  (as opposed to a faithful port that emits no call — cf. `WIDE_NO_JS_CALL_FORM`)
  and file per-cluster convergence stories sized from the Rails bodies.
- For clusters whose Ruby call has no JS call form, extend
  `WIDE_NO_JS_CALL_FORM` / the significance predicate instead of leaving them
  baselined, so the ratchet shrinks rather than holding them forever.
- Account for the 219 removed entries: confirm each was re-attributed or
  genuinely resolved, not silently lost.
- Report the resulting baselined count; it should be materially below 5436.
