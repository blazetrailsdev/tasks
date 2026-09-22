---
title: "tasks new refuses a slug used by any RFC and a story with no body"
status: draft
updated: 2026-09-22
rfc: "0091-tasks-backlog-integrity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story ids are global — `pnpm validate` rejects two `stories/<id>.md` under
different RFCs as `duplicate story id` — but `tasks new` only checks its own
target path (`src/authoring.ts:175`, `existsSync(join(dir, rel))`). A slug
already used under another RFC sails through, lands as a `new:` commit on
`main`, and CI goes red for every open PR at once.

It also accepts no body at all: `--body-file` is optional (`src/cli.ts:277-279`)
and nothing in `newStory` inspects the content, so a title-only stub with empty
`## Context` / `## Acceptance criteria` headings is a valid creation.

The two gaps compound into one recurring incident: a stray `tasks new <rfc> x`
files a stub named `x`, the second one collides, and `main` is red until
someone deletes them by hand. That has now happened three times —
tasks#120 (2026-09-14, `0061` + `0130`), tasks#124 (2026-09-15, `0130` twice)
and tasks#153 (2026-09-22, `0082`, `0132`, `0151`, `0155`) — seven stray `x`
files in eight days, all from `new:` commits. Deleting them is the symptom fix;
this story is the cause fix.

## Acceptance criteria

- `tasks new <rfc> <slug>` exits 1 with a message naming the existing file when
  `rfcs/*/stories/<slug>.md` exists under **any** RFC on `origin/main`, not
  only under `<rfc>`. The check runs in the same scratch worktree the write
  does, so it sees what `main` sees.
- `tasks new` exits 1 when the story would have no body — `--body-file`
  omitted, or the file empty or consisting only of the template headings. The
  message says what a body must contain (a `## Context` and at least one
  acceptance criterion) and points at `--body-file`.
- Both refusals leave nothing behind: no file in the scratch worktree, no
  commit, no DB row (`src/new-story.test.ts` already covers the shape for the
  same-RFC collision at `:67`; add the cross-RFC and the empty-body cases).
- `tasks new` keeps working for a slug that is unique across the tree with a
  real body — no change to the happy path.

## Definition of done

Making `validate` tolerate duplicate ids, or auto-suffixing a colliding slug,
does not close this story. The id is the story's address in every `deps:`
list, every `--pr` receipt and every URL; it has to be unique on entry, not
patched after.

## Verification

```sh
pnpm vitest run src/new-story.test.ts
# manual, against a scratch main:
tasks new 0091-tasks-backlog-integrity some-existing-slug-from-another-rfc   # exit 1, names the file
tasks new 0091-tasks-backlog-integrity fresh-slug                            # exit 1, no body
```

## Notes

- Which caller emits `tasks new <rfc> x` is not established — the `new:`
  commits carry no invoking-agent metadata. The guard makes the question moot;
  do not spend the story finding the caller.
- The same-RFC guard at `src/authoring.ts:175` stays as the cheap first check;
  the global one is a glob over `rfcs/*/stories/` in the scratch worktree.

dry run: rfcs/0091-tasks-backlog-integrity/stories/tasks-new-refuses-cross-rfc-slug-and-empty-body.md not written (--no-commit)
