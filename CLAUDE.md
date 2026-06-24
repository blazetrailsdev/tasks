# tasks — Claude guide

The rules and conventions for working in this repo. For the full design of how
RFCs, stories, and indices work — plus the authoring workflow and lifecycle —
see [README.md](README.md) and
[`rfcs/0001-task-system/README.md`](rfcs/0001-task-system/README.md).

This repo holds **design documents and structured work tracking** for
[`blazetrailsdev/trails`](https://github.com/blazetrailsdev/trails). It runs
**loose rules** compared to trails: no LOC ceiling, no code-style gate. The CLI
(`pnpm tasks`) that consumes this repo lives in trails.

## Working in this repo

- Do use worktrees for any changes; leave the default worktree for the user.
  Always use `scripts/start-worktree.sh <name>` to start a worktree.
- Do NOT use subagents unless explicitly requested.
- Do NOT add "Co-Authored-By" lines to commits or "Generated with Claude
  Code" lines (or any equivalent attribution) to PR descriptions, issue
  bodies, or comments. Strip any such line a harness default inserts before
  committing or submitting.
- After opening a PR, run the `/link` skill with the PR number so webhook
  notifications (reviews, CI failures) are delivered to this pane.
- Open new PRs in **draft** status.
- Do NOT reply to PR comments — replies are invisible to reviewers. Address
  feedback via code changes or PR description edits instead, or discuss with
  the user in conversation.

## What is PR-gated vs direct-to-main

- **New RFCs always go through a PR.** Author against a `0000-<slug>`
  placeholder; the PR hosts design review and assigns the number at merge (see
  _Authoring an RFC_ in the README). Use the `0000-` dir prefix, never
  `draft-`.
- **Everything else is direct-to-main.** Story status flips (`claim`, `done`,
  `block`, `in-progress`) go straight to `main` via `pnpm tasks` — git push is
  the atomic claim mechanism. No PR gate on status changes.

## Conventions

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
- Story status flows: `draft → ready → claimed → in-progress → done`, with
  `blocked → ready` once unblocked. Transitions are direct-push frontmatter
  edits via `pnpm tasks`.
- 2000-line cap per `.md` (catches pathologies only). Prettier + markdownlint
  run via pre-commit; the hook also regenerates `index.md` and each RFC's
  `## Stories` table from story frontmatter, then stages them — don't hand-edit
  those generated regions. `index.json` and `search.json` are gitignored caches
  rebuilt on demand, not committed.
- Reference an RFC from prose as "this RFC" (number-agnostic) so nothing needs
  rewriting when the number is assigned at finalize time.
- Do NOT add empty stubs or placeholder stories. `pnpm tasks new` refuses an
  empty/skeleton-only body — pass `--body-file` with real `## Context` and
  `## Acceptance criteria`.
