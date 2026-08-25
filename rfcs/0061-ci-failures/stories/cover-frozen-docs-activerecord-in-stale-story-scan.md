---
title: "Route stale story citations in the frozen docs/activerecord tree somewhere actionable"
status: done
updated: 2026-08-03
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6006
claim: "2026-08-03T18:57:42Z"
assignee: "cover-frozen-docs-activerecord-in-stale-story-scan"
blocked-by: null
closed-reason: null
---

## Context

`scripts/stale-story-references.ts` (shipped in #6001) scans `.md` under the
trails tree via `collectMarkdownFiles`, but excludes `docs/activerecord/`
outright (`MARKDOWN_SKIP_TREES`). The reason is real: that tree is frozen by RFC
0011 Phase 4 and CI's `Docs ActiveRecord Freeze` job fails any PR that edits a
file there (allowlist: `parity-verification.md`), so a stale citation found
there could not be resolved by correcting the prose — the gate would be red with
no legal fix.

The cost is that stale story citations in `docs/activerecord/` are unguarded
forever. That tree is large and full of plan prose that names stories as
trackers, so it is exactly where stale citations accumulate.

Two shapes worth weighing:

- Scan the tree but report its findings as a separate, non-failing inventory
  (a report the freeze cutover can consume), keeping the hard gate on the
  editable tree.
- Or confirm the tree is genuinely inert (frozen prose nobody reads as current
  guidance) and close this as won't-fix with that finding recorded.

No Rails counterpart: this is a repo CI/backlog hygiene script, not mirrored
framework behavior.

## Acceptance criteria

- `docs/activerecord/` markdown is either covered by a non-gating inventory of
  stale story citations, or the tree is documented as inert with the evidence
  that made that call.
- The hard gate's behavior on the editable tree is unchanged — no new red
  without a legal fix.
- `pnpm vitest run scripts/stale-story-references.test.ts` stays green.
