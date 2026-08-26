---
title: "Correct the pnpm validate, ingest-mitigation and story-authoring claims in CLAUDE.md"
status: draft
updated: 2026-08-26
rfc: "0001-task-system"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7066 added the "Task state vs. task prose" section to `trails/CLAUDE.md`.
Review feedback arrived with three corrections; the PR merged before they were
pushed, so `main` carries all three defects today. The fix was written and
verified against source but never landed — it is reproduced verbatim below.

**1. `pnpm validate` does not exist in trails — this one actively misfires.**

`CLAUDE.md:235` (on `main`) tells an agent to run `pnpm validate` as the safe
alternative to `tasks ingest`. Verified: trails' `package.json` has no
`validate` script; the tasks repo's does (`node scripts/validate.mjs`). The
reader of this section is by construction in a trails worktree, so they get a
pnpm error immediately after being told this is the safe path — which undercuts
the trap the paragraph exists to warn about. `pnpm tasks show` / `pnpm tasks
list` alongside it are both correct as written.

**2. `tasks new` strands stories authored off `main`.**

`tasks/src/cli.ts:256-261` commits the new story to the CALLER's tasks dir
(a worktree's branch) and then calls `ingest()`, but `tasks/src/ingest.ts:152`
resolves `mainWorktree()` and refuses unless that tree is on `main`. So from a
worktree branch the file lands on the branch and the row either never appears or
points at a file `main` does not have. This happened for real: the PR #7064
worker filed two findings stories via `post-merge-findings`, they were committed
to an already-merged worktree branch, and both had to be recovered by hand.

Note for whoever picks this up: at the time of writing, an authoring-side guard
(`error: <dir> is on <branch>, not main — refusing to author.`) was reported as
landed but was NOT present on `origin/main` — `git grep "refusing to author"
origin/main -- src scripts` returned nothing, and `src/authoring.ts:94` still
called plain `resolveTasksDir()` with no branch check. Re-verify before writing;
the doc wording below is deliberately phrased to stay true whether or not that
guard lands, since it states the constraint rather than the mechanism.

**3. The ingest trap is mitigated but not for pre-existing worktrees.**

`ingest` now resolves the main working tree regardless of cwd and refuses if it
is not on `main`, so the leaky command creates 0 rows today. But an agent
worktree runs its OWN checkout's copy of the CLI, so a worktree created before
that fix still runs the leaky version. "Fixed, but your worktree may predate the
fix — still don't reach for it" is the accurate shape and keeps the advice
load-bearing rather than historical.

## Acceptance criteria

- [ ] `CLAUDE.md` no longer tells a trails agent to run `pnpm validate`; it
      names the tasks repo's script, e.g. `(cd tasks && pnpm validate)`.
- [ ] The ingest bullet carries the "mitigated, but your worktree may predate
      the fix" clause rather than presenting the trap as purely historical.
- [ ] The story-authoring paragraph states that new stories must land on `main`
      and says what goes wrong when they do not (stranded file, row pointing at
      a file `main` lacks), with the hand-recovery incident as the why.
- [ ] `npx prettier --check CLAUDE.md` passes.

## The exact patch that was verified and not landed

Replace the `tasks ingest` bullet with:

```markdown
- **`tasks ingest` is a sync verb, not an inspection verb.** Do not reach for it
  to check that a branch's stories parse — that is `pnpm tasks show` /
  `pnpm tasks list`, or `(cd tasks && pnpm validate)` (there is no `validate`
  script in trails itself). Running ingest from a worktree once published 10
  unmerged stories into the shared DB. It now resolves the **main** working
  tree whatever your cwd and refuses unless that tree is on `main`, so the same
  command creates 0 rows today — but your worktree runs its own checkout's copy
  of the CLI, so one created before that fix still runs the leaky version.
  Still don't reach for it.
```

Replace the opening of the story-authoring paragraph with:

```markdown
**Creating a story is authoring, so it is markdown**: `pnpm tasks new <rfc>
<slug> --body-file <path>` writes the file, commits it, and runs ingest — which
is what creates the row, since authoring never inserts one directly. Do not
insert a row any other way. **New stories have to land on `main`**: ingest reads
the main working tree, so a story committed onto a worktree branch is stranded —
the row can point at a file `main` does not have, or no row appears at all. This
has already had to be recovered by hand.
```

## Verification

```bash
node -e "console.log(require('./package.json').scripts.validate)"   # undefined
git grep -n "pnpm validate" -- CLAUDE.md   # must not appear unqualified
npx prettier --check CLAUDE.md
```
