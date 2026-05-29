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

```bash
cp -r rfcs/0000-template rfcs/NNNN-your-slug
# Edit README.md frontmatter (rfc, title, owner, packages, clusters)
# Add story files under stories/
git commit -am "RFC NNNN: <title>"
```

Numbering is **strictly sequential** — pick the next free integer. The
pre-commit hook regenerates `index.md`, `index.json`, and `search.json`.

## Rules

This repo runs **loose rules** compared to trails:

- No code-style LOC ceiling; 2000-line cap per `.md` only catches pathologies
- Prettier + markdownlint via pre-commit
- Frontmatter validation in CI (schema, dep-cycle, ID uniqueness, cluster match)
- **Direct-to-main pushes are the default.** PRs are reserved for substantive
  RFC README design review.
- Story status flips (`claim`, `done`, `block`) go straight to `main` via
  `pnpm tasks` — git push is the atomic claim mechanism.

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
    ├── 0001-task-system/
    │   ├── README.md
    │   └── stories/
    └── NNNN-your-rfc/
        ├── README.md
        └── stories/
```

See [`rfcs/0001-task-system/README.md`](rfcs/0001-task-system/README.md) for the
full design of how this repo works.
