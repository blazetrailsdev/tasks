---
title: "Gate or retire post-merge-findings' branch-name story fallback"
status: draft
updated: 2026-08-26
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`.claude/skills/post-merge-findings/run.sh` marks stories done from the merged
PR body's `Closes-story:` trailers, and falls back to the branch name when the
body carries none (`run.sh:111-115`, branch `<story-id>-<4 hex>` with the
suffix stripped).

PR #7087 added the PR-time gate that refuses to let a PR close a story it still
cites as pending (`scripts/closing-story-references.ts`, the `Closing-story
citations` step in `preflight`, and a belt in `run.sh` before `pnpm tasks
done`). Both halves key off `closesStoryIds(prBody)` — the trailers.

That leaves the branch fallback completely ungated: a PR with **no** trailer
still closes a story, via its branch name, and neither the preflight step nor
the belt ever sees that id. So the exact failure the gate exists to prevent
(#7083 for #7077, #5976 for #5971 — main goes red seconds after the merge
because a landed story is still cited in a comment) is still reachable through
the branch path.

#7087's story deliberately scoped this out, because gating on a branch-derived
id would red a legitimately partial PR — the sanctioned escape hatch is to drop
the `Closes-story:` trailer while keeping the story stamped in-progress with
`--pr N`, and that hatch is expressed precisely by having no trailer. It asked
for this to be filed if the work made the answer obvious. It did: the fallback
closes stories that no gate judges, which is the same hole with a different
door.

## Converged shape

Decide whether the branch fallback should close a story at all, and make the
two paths agree:

- If it should: extend the belt in `run.sh` to run the same check over the
  branch-derived id before flipping it done, and refuse on a finding — the
  belt, not the preflight step, because a branch-derived id is not knowable
  from the PR body the preflight step reads.
- If it should not: delete the fallback, so `Closes-story:` is the single way a
  PR closes a story, and the gate's population is by construction the whole
  population. This is the simpler answer and the one that makes
  `closesStoryIds` genuinely the single source of truth.

Either way the "no trailer = partial PR" escape hatch must survive: a partial
PR must still be able to leave its story in-progress with `--pr N`.

## Acceptance criteria

- The branch fallback either closes nothing, or is gated by the same pending-
  citation check the trailer path is.
- A partial PR can still keep its story stamped in-progress by omitting the
  trailer, with no new failure.
- `scripts/closing-story-references.test.ts` covers whichever path is kept.
- No new baseline, allowlist, skip, or eslint disable.
