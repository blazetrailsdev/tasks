---
title: "parity:api:build: lower the per-file unreviewed marks for rows it drops"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5928
claim: "2026-08-02T22:58:24Z"
assignee: "api-build-lower-unreviewed-marks-on-drop"
blocked-by: null
closed-reason: null
---

## Context

`parity:api:build` migrates wide-baseline rows into `@missingRailsCall` JSDoc tags and
drops them from the split baseline —
`scripts/api-compare/build.ts:457-459` filters `wideBaseline` down to
`remaining` and calls `writeSplitBaseline(remaining, WIDE_BASELINE_DIR)` — but
it never touches the unreviewed high-water marks under
`scripts/api-compare/call-mismatches-wide-unreviewed/`.

Every dropped row that still carried the seeded `DEFAULT_REASON` therefore
leaves its source's shard stale-HIGH. The wide gate's slack arm
(`unreviewed-ratchet.ts#slackByPath`, consumed at
`lint-call-mismatches-wide.ts:470`) then reds on the next run, and the only fix
is a full `pnpm parity:api:calls:reseed` — a compare regeneration the author of an
`parity:api:build` run did not otherwise need.

This predates the shard (PR #5922); the global mark had the same gap. Sharding
makes it cheap to fix precisely: `build.ts` already knows exactly which
(package, tsFile) it rewrote, so it can lower just those shards with
`nextMarks` + `writeMarks` instead of forcing a whole-repo reseed. Only-shrink
is preserved for free — `nextMarks` takes the min.

## Acceptance criteria

- After `parity:api:build --package <pkg>` drops seeded rows, `pnpm parity:api:calls`
  passes with no slack arm firing and no separate reseed.
- The marks are lowered ONLY for sources `build.ts` actually rewrote; every
  other shard is byte-identical (a `--package`-scoped run must not rewrite the
  whole tree).
- `--dry-run` writes neither the baseline nor the marks.
- A shard that reaches 0 is deleted, not left as `{"max": 0}`, matching
  `writeMarks`.
- Test covers a drop of seeded rows lowering exactly one shard.
