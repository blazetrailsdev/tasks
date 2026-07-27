---
title: "Drop the duplicate allowlist report key once the stats pipeline reads tagged"
status: claimed
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-07-27T20:47:50Z"
assignee: "drop-duplicate-allowlist-report-key"
blocked-by: null
closed-reason: null
---

## Context

PR #5399 retired `extra-surface-allow.json`. To avoid breaking the external
stats-DB consumer, it left BOTH report keys in place, pointing at the same
object:

```ts
const taggedSummary: AllowlistSummary = { total, matched, stale: staleTagged };
return { ..., allowlist: taggedSummary, tagged: taggedSummary };
```

(`scripts/api-compare/extra-surface.ts`, `buildReport`.)

`allowlist` is now a misnomer — there is no allowlist, only
`@noRailsEquivalent` tags — and two keys carrying one value invites a reader to
assume they can diverge. Nothing in-repo reads `report.allowlist`; the consumer
is the external stats pipeline, which is why #5399 did not simply drop it.

The `--json` shape is a published contract for that pipeline, so this cannot be
a unilateral rename: the stats-DB side must be migrated to read `tagged` (or
taught to accept either) BEFORE the key is removed here. Sequencing is the
whole story; the trails-side edit is a few lines.

Related: `user_api_test_compare_outputs_feed_stats_db` — these outputs feed the
stats DB and must never gate.

## Acceptance criteria

- Confirm what the stats pipeline actually reads (`allowlist`, `tagged`, or
  both) before changing anything; record the finding in the PR body.
- If the pipeline is migrated or tolerant: drop the `allowlist` key, keep
  `tagged` as the single summary, and rename `AllowlistSummary` to match.
- If it is not: leave the shape alone and instead tighten the doc comment on
  the `allowlist` field to state it is a frozen compatibility alias with a
  pointer to whatever blocks its removal — so the duplication is explained
  rather than merely present.
- Either way, `extra-surface.test.ts` pins the decision (today it asserts
  `report.allowlist` equals `report.tagged`).
- No change to the per-package counts (`totalExtras`, `totalAllowlisted`,
  `totalNovel`, `totalMoved`) — those stay exactly as they are.
