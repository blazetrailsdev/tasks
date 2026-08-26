---
title: "Gate Closes-story citations at PR time, not after the merge"
status: in-progress
updated: 2026-08-26
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: 7087
claim: "2026-08-26T14:41:07Z"
assignee: "gate-closing-story-citations-at-pr-time"
blocked-by: null
closed-reason: null
---

## Context

`scripts/stale-story-references.ts` reds `Unit Tests` on main when a comment
promises work to a story that has already landed. Its input is the story's
`status:` frontmatter in the **tasks** repo, and that status flips to `done`
only _after_ the merge — `.claude/skills/post-merge-findings/run.sh:110-125`
parses the `Closes-story:` trailers out of the PR body and runs `pnpm tasks
done` once the PR is merged.

So a PR that closes a story is structurally blind to the check that judges it
seconds later: its own CI sees the story still in progress, passes, merges, and
main goes red with no commit in between.

That is exactly #7083. `a8e658cb` (#7077) deleted
`AbstractMysqlAdapter#lookupCastType` and closed
`mysql-native-type-map-converges-onto-type-map`, but left the JSDoc sentence
"… which `mysql-native-type-map-converges-onto-type-map` deletes" at
`packages/activerecord/src/connection-adapters/abstract-adapter.ts:2746` — in a
file the same PR edited. #7083 was the mop-up. The prior instance is #5976
(`activesupport-json-encoding-time-precision`, #5971), which is what motivated
the guard in the first place.

Move the check to PR time: a PR whose body declares `Closes-story: <id>` must
carry no pending citation of `<id>` anywhere in the tree.

## Plan

1. **`scripts/closing-story-references.ts`** — reuse `scanStoryReferences()`
   from `stale-story-references.ts` verbatim; it already collects every
   pending-promise citation across `packages/`, `scripts/`, `eslint/` and the
   non-frozen `.md` trees, and already vetoes provenance phrasing
   (`PROVENANCE_PHRASE`). Only the predicate is new:

   ```ts
   export function closesStoryIds(prBody: string): string[];
   export function closingStoryReferences(
     refs: readonly StoryReference[],
     closingIds: ReadonlySet<string>,
   ): StoryReference[];
   ```

   `closesStoryIds` becomes the single source of truth for the trailer regex —
   `run.sh:117-120` should read the same shape, so the gate and the marker can
   never disagree about what a PR closes. Because the extractor is shared, a
   finding here is a guaranteed red on main; there is no new false-positive
   class and no judgement call in the message.

2. **`scripts/closing-story-references.test.ts`** — collected by the existing
   `scripts/*.test.ts` glob in `vitest.config.ts:445`, so no vitest or `ci.yml`
   registration is needed. Cases: case-insensitive trailer parse; several
   trailers (a bundle PR closes more than one); a citation of a story the PR
   does _not_ close is left alone; the #7077 comment as a verbatim fixture. The
   new test file must add itself to `SKIP_FILES` the way
   `stale-story-references.test.ts` does, or the line-based scan reads its own
   fixture as a real comment.

3. **A `Closing-story citations` step in the `preflight` job** (`ci.yml:364`).
   Preflight already has `GH_TOKEN`, `PR_NUMBER`, a full checkout and a
   precedent for scanning the PR body (the attribution step). Gate it
   `if: ${{ !cancelled() && github.event_name == 'pull_request' }}`, as
   `Docs ActiveRecord Freeze` is. No tasks checkout, no build — seconds.
   The failure names `file:line` and the two legal fixes: re-point the citation
   at the story that owns the work now, or delete it.

4. **`pnpm check:closing-story-refs [--pr N]`** in root `package.json`, so an
   agent can run it before opening and after editing a PR body. With no `--pr`
   it reads the trailers from the branch's own commit messages.

5. **Belt in `run.sh`**: before `pnpm tasks done`, run the same check over the
   merged tree; on a finding, refuse to mark the story done and print the
   `file:line`. This is what closes the one hole in step 3 — `on: pull_request`
   carries no `edited` type (`ci.yml:34`), so a trailer added to the body after
   the last CI run is not gated by it, and adding `edited` would re-run all of
   CI on every body tweak. The belt converts that case from a post-merge red
   into a pre-flip prompt in the session that can still fix it.

## Out of scope

`run.sh:111-115` also derives a story id from the branch name when the body
carries no trailer at all. Gating on that would red a legitimately partial PR —
the sanctioned escape hatch is to drop the `Closes-story:` trailer while
keeping the story stamped in-progress with `--pr N`. Report a branch-derived
hit as a warning, never a failure. Whether the branch fallback should close a
story at all is a separate question; file it if this work makes the answer
obvious.

## Acceptance criteria

- A PR body declaring `Closes-story: <id>` with a pending citation of `<id>`
  anywhere in the tree fails `preflight` with the `file:line`, on the PR,
  before merge.
- Reconstructing #7077's tree and body reproduces the failure; #7083's fix
  clears it. Same for #5971/#5976.
- A citation of a story the PR does not close, and a provenance citation
  ("`X` landed (#3874)"), both stay green.
- The trailer regex has exactly one definition, shared by the gate and
  `post-merge-findings/run.sh`.
- `run.sh` refuses to mark a story done while a pending citation of it remains,
  naming the file and line.
- No new baseline, allowlist, skip, or eslint disable.
