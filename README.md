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

RFCs are **unnumbered until merge.** You author against a `draft-<slug>`
placeholder; the **PR is where the design discussion happens**; the number is
assigned when the PR is finalized, right before merge. Nobody pre-claims an
integer, so concurrent RFCs never collide on the index.

```bash
# 1. Branch + scaffold a placeholder (note the `draft-` prefix, no number).
git checkout -b rfc-your-slug
cp -r rfcs/0000-template rfcs/draft-your-slug
#    Edit README.md: frontmatter `rfc: "draft-your-slug"` (+ title, owner,
#    packages, clusters) and the H1 (`# RFC — Title`). Add stories under
#    stories/ — each story's `rfc:` field is also "draft-your-slug".
git add rfcs/draft-your-slug && git commit -m "RFC (draft): <title>"

# 2. Open a PR. Discuss / revise there. CI validates the placeholder as-is.

# 3. Right before merge, assign the next free number:
node scripts/finalize-rfc.mjs draft-your-slug        # add --dry-run to preview
#    → renames the dir to NNNN-your-slug, rewrites every `rfc:` reference,
#    injects the number into the H1, and rebuilds the indices.
git add -A && git commit -m "RFC NNNN: assign number" && # merge the PR
```

`main` only ever holds numbered RFCs; `draft-*` placeholders live on PR
branches. The pre-commit hook regenerates `index.md`, `index.json`, and
`search.json`. Reference an RFC from prose as "this RFC" (number-agnostic) so
nothing needs rewriting at finalize time beyond the H1 and `rfc:` fields.

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

| Status       | Meaning                                                                | Terminal? |
| ------------ | ---------------------------------------------------------------------- | --------- |
| `draft`      | Under design. Stories may exist but should not be claimed.             | no        |
| `active`     | Accepted. Stories are open for pickup.                                 | no        |
| `closed`     | All stories `done` (or explicitly abandoned). Work complete.           | yes       |
| `postponed`  | Deferred indefinitely — not abandoned. May return to `active` later.   | no        |
| `superseded` | Replaced by another RFC. Carries `superseded-by: "NNNN-slug"` pointer. | yes       |

Stories progress independently:

```text
draft → ready → claimed → in-progress → done
                        ↓
                     blocked (→ ready once unblocked)
```

Transitions are direct-push frontmatter edits. No PR gate on status changes.

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
    └── draft-your-rfc/        ← placeholder; lives on a PR branch, numbered at merge
        ├── README.md
        └── stories/
```

See [`rfcs/0001-task-system/README.md`](rfcs/0001-task-system/README.md) for the
full design of how this repo works.
