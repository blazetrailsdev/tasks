# blazetrailsdev/tasks

Design documents and structured work tracking for
[`blazetrailsdev/trails`](https://github.com/blazetrailsdev/trails).

This repo is the source of truth for:

- **RFCs** — long-lived design documents under [`rfcs/`](rfcs/) (see [`rfcs/0001-task-system`](rfcs/0001-task-system/))
- **Stories** — discrete units of work, machine-readable via YAML frontmatter
- **Indices** — `index.md` / `index.json` / `search.json`, auto-generated on commit

The trails repo holds the CLI (`pnpm tasks`) that consumes this repo's contents.

## Quick start

```bash
# Clone as a sibling of trails/
cd ~/github/blazetrailsdev
git clone git@github.com:blazetrailsdev/tasks.git

# In the trails repo
pnpm tasks ready        # list unblocked stories
pnpm tasks next-bundle  # next cluster bundle ≤ 250 LOC
pnpm tasks claim <id>   # atomically claim a story
pnpm tasks done <id> --pr <n>
```

## Authoring an RFC

RFCs are **unnumbered until merge.** You author against a **`0000-<slug>`**
placeholder; the **PR is where the design discussion happens**; the number is
assigned when the PR is finalized, right before merge. Nobody pre-claims an
integer, so concurrent RFCs never collide on the index.

> **Use the `0000-` dir prefix, never `draft-`.** `0000` is the "number not yet
> assigned" sentinel — `finalize-rfc.mjs` swaps it for the real number at merge.
> It deliberately does **not** reuse the word `draft`, which is already a
> lifecycle _status_ value (`status: draft`); a `draft-` dir prefix collides
> with that and reads ambiguously. (Legacy `draft-` placeholders still validate
> so any pre-convention PR finalizes cleanly, but author all new RFCs as
> `0000-`.)

```bash
# 1. Branch + scaffold a placeholder (note the `0000-` prefix — number at merge).
git checkout -b rfc-your-slug
cp -r rfcs/0000-template rfcs/0000-your-slug
#    Edit README.md: frontmatter `rfc: "0000-your-slug"` (+ title, owner,
#    packages, clusters) and the H1 (`# RFC — Title`). Add stories under
#    stories/ — each story's `rfc:` field is also "0000-your-slug".
git add rfcs/0000-your-slug && git commit -m "RFC (draft): <title>"

# 2. Open a PR. Discuss / revise there. CI validates the placeholder as-is.

# 3. Right before merge, assign the next free number:
node scripts/finalize-rfc.mjs 0000-your-slug         # add --dry-run to preview
#    → renames the dir to NNNN-your-slug, rewrites every `rfc:` reference,
#    injects the number into the H1, and rebuilds the indices.
git add -A && git commit -m "RFC NNNN: assign number" && # merge the PR
```

`main` only ever holds numbered RFCs; `0000-*` placeholders live on PR
branches. The pre-commit hook regenerates `index.md`; `index.json` and
`search.json` are gitignored caches rebuilt on demand, not committed. Reference an RFC from prose as "this RFC" (number-agnostic) so
nothing needs rewriting at finalize time beyond the H1 and `rfc:` fields.

The RFC template carries a **`## Non-goals`** section — the canonical home for
deliberately-descoped decisions, each with a one-line reason — and a
**`## Verification`** section stating the concrete metric, count, or burndown
target by which we'll judge the RFC worked. Story files mirror this: an
optional **`## Definition of done`** captures the negative-space sentence (what
does _not_ close the story) and an optional **`## Verification`** gives the
exact command(s) that prove it — both are delete-if-empty like `## Notes`.

## Rules

This repo runs **loose rules** compared to trails:

- No code-style LOC ceiling; 2000-line cap per `.md` only catches pathologies
- Prettier + markdownlint via pre-commit
- Frontmatter validation in CI (schema, dep-cycle, ID uniqueness, cluster match)
- **New RFCs always go through a PR** — that's what assigns the number and
  hosts design review (placeholder → discussion → numbered at merge; see
  _Authoring an RFC_). Editing an already-merged RFC's README is also PR-gated.
- **Everything else is direct-to-main.** Story status flips (`claim`, `done`,
  `block`) go straight to `main` via `pnpm tasks` — git push is the atomic
  claim mechanism.

## Lifecycle

RFCs progress through five statuses, set via the `status:` frontmatter field:

| Status       | Meaning                                                                                               | Terminal? |
| ------------ | ----------------------------------------------------------------------------------------------------- | --------- |
| `draft`      | Under design. Stories may exist but should not be claimed.                                            | no        |
| `active`     | Accepted. Stories are open for pickup.                                                                | no        |
| `closed`     | Every story `done`. Work complete. (Abandon a story by deleting it — there is no `abandoned` status.) | yes       |
| `postponed`  | Deferred indefinitely — not abandoned. May return to `active` later.                                  | no        |
| `superseded` | Replaced by another RFC. Carries `superseded-by: "NNNN-slug"` pointer.                                | yes       |

Stories progress independently:

```text
draft → ready → claimed → in-progress → done
  any pre-done state → blocked → ready (once unblocked)
  any pre-done state → closed  → ready (once reopened)
```

`blocked` is reachable from any pre-`done` state (not just post-claim): the only
requirement is a `blocked-by` reason, and the unblock path returns the story to
`ready`. So `draft → blocked` is legal when a story is specified but known to be
gated on other work.

`closed` is the terminal state for a story that will **never ship code** —
superseded, abandoned, or won't-do. It is reachable from any pre-`done` state
(`draft` / `ready` / `blocked` / `in-progress`) via `pnpm tasks close <id>
--reason "<text>"`, and closing REQUIRES a `closed-reason` (the way `blocked`
requires `blocked-by`; the reason text distinguishes superseded vs abandoned vs
won't-do — there is no separate `superseded` status). This replaces the old
`blocked → ready → done --force` dance for stories that were parked forever or
faked as `done` against an RFC instead of shipped code. `done` (work shipped)
and `closed` (work abandoned) are the two terminal states; a `done` story
cannot be closed. Reopening a closed story returns it to `ready`, mirroring the
unblock path. Both `done` and `closed` count as terminal for dependents — a
story depending on a closed story is unblocked (closed will never ship, but
never blocks either) — and for RFC rollup: an RFC whose every story is `done`
or `closed` is eligible to close.

Transitions are direct-push frontmatter edits. No PR gate on status changes.

`scripts/validate.mjs` enforces these statuses' **cross-field** consistency, so
a hand-edit or `--force` flip can't leave a story self-contradictory:

- `draft` / `ready` must have null `claim`, `assignee`, and `pr`.
- `claimed` / `in-progress` require `claim` + `assignee`; `in-progress` also
  requires `pr`.
- `blocked` requires `blocked-by`; only `blocked` stories may carry it.
- `closed` requires `closed-reason`; only `closed` stories may carry it.
- A `closed` RFC may not have any story that is not `done` or `closed`.
- No two RFC dirs may share a four-digit numeric prefix (a finalize-flow bug);
  the pre-convention `0022-*` pair is grandfathered via an in-code allowlist.
- `created` / `updated` must be a `YYYY-MM-DD` calendar date — this is what
  catches an unfilled `0000-` template placeholder (`created: YYYY-MM-DD`).

`done` is deliberately **not** shape-constrained: it may carry a full
`claim`/`assignee`/`pr` (normally worked) or have them all null (the
completed-before-anyone-reached-it path below), so neither is required.

Two cases are deliberately **legal**, matching what the CLI does rather than
inventing a stricter rule:

- **`ready` with un-`done` deps** — `ready` means "specified and open for
  pickup"; `pnpm tasks ready` filters _claimability_ by dep status, so a ready
  story whose deps are still open simply doesn't surface in the queue yet.
- **`done` with null `pr`** — a story can be completed before anyone reaches it
  (no PR of its own); the CLI's done-without-PR path records exactly this.

## Layout

```text
.
├── README.md                  ← you are here
├── index.md                   ← RFC registry (auto-generated)
├── index.json                 ← story metadata (auto-generated)
├── search.json                ← search index (auto-generated)
├── scripts/                   ← validate + build-index tooling
└── rfcs/
    ├── 0000-template/         ← copy this to start a new RFC
    │   ├── README.md
    │   └── stories/template-story.md
    ├── 0001-task-system/      ← numbered (merged)
    │   ├── README.md
    │   └── stories/
    └── 0000-your-rfc/         ← placeholder; lives on a PR branch, numbered at merge
        ├── README.md
        └── stories/
```

See [`rfcs/0001-task-system/README.md`](rfcs/0001-task-system/README.md) for the
full design of how this repo works.
