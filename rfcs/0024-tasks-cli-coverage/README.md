---
rfc: "0024-tasks-cli-coverage"
title: "tasks CLI full coverage — no hand-editing the tasks repo"
status: closed
created: 2026-06-11
updated: 2026-06-23
owner: "@deanmarano"
packages: []
clusters:
  - frontmatter-editor
  - rfc-commands
  - story-fields
  - guardrails
related-rfcs:
  - "0001-task-system"
---

# RFC 0024 — tasks CLI full coverage

## Summary

Extend the `pnpm tasks` CLI so that **every** routine operation on this repo —
authoring and finalizing RFCs, transitioning RFC status, setting array-valued
frontmatter, editing story and RFC bodies — goes through a command, never a hand-edit of
a `.md` file or a direct call to a standalone script. The goal: an agent (or a
human) should be able to drive the whole backlog without ever opening a file in an
editor, and the canonical-checkout safety invariants stay intact.

## Motivation

The CLI today covers story _status_ mutations well (`claim`, `in-progress`,
`done`, `block`, `priority`, `new`, `refine`) but punts a large class of work to
hand-editing or standalone scripts. Concretely, everything below currently
requires editing files directly or invoking a script that isn't a `tasks`
subcommand:

- **Authoring a new RFC** — `cp -r rfcs/0000-template`, then hand-edit frontmatter
  and body.
- **Finalizing an RFC number** — `node scripts/finalize-rfc.mjs 0000-<slug>`, a
  standalone script that is **easy to forget**.
- **RFC frontmatter** — status transitions (`draft → active → closed → postponed →
superseded`), `superseded-by`, `related-rfcs`, `clusters`, `packages`.
- **Array-valued story fields** — `deps`, `deps-rfc`.
- **Story bodies** — Context / Acceptance criteria / Notes (only reachable via
  `refine` from a worktree).

Two structural causes underlie the list:

1. **The frontmatter editor is scalar-only.** `editFrontmatter()` in the CLI
   deliberately refuses any key whose next line is indented (a YAML list or nested
   map) — overwriting it would orphan the children. So no command can touch
   `deps`, `clusters`, `related-rfcs`, `packages`, or `superseded-by`.
2. **There are no RFC-lifecycle commands at all.** `new` creates _stories_ only.

There is also a **process hazard, not just an ergonomics gap**: finalize is a
manual _pre-merge_ step. When it is skipped, a `rfcs/0000-*` placeholder lands on
`main`, violating the "main only holds numbered RFCs" invariant. This has already
happened in practice and required a manual repair PR. The fix is not only to wrap
finalize as a command but to make the invariant **enforced** rather than
remembered.

## Design

### 1. Array-safe, comment-preserving frontmatter editor (keystone)

A block-aware setter that replaces a key's scalar **or** its indented block (up to
the next same-indent key), leaving the rest of the file — including the inline
comments the template relies on (e.g. `priority: null # LOWER = higher…`) —
byte-for-byte untouched. A naive `js-yaml` round-trip is rejected: it reflows the
document and strips comments. This primitive unblocks every array/RFC command
below, so it ships first.

### 2. RFC-lifecycle commands

- `tasks new-rfc <slug> [--title --owner --packages --clusters --related]` —
  scaffold `rfcs/0000-<slug>/` from the template, fill frontmatter, commit + push.
  Mirrors the existing `new` / `buildStoryContent()` path with a `buildRfcContent()`
  twin.
- `tasks finalize <slug> [--dry-run]` — wrap `finalize-rfc.mjs` (rename `0000-` →
  `NNNN-`, rewrite refs + H1, rebuild indices) inside the standard
  `commitAndPush` mutate/retry loop.
- `tasks rfc <slug> --status <s>` / `--supersede <other-slug>` / `--relate <csv>` /
  `--clusters <csv>` / `--packages <csv>` — RFC frontmatter mutations. Scalar
  fields use the existing editor; arrays use the new block editor.

### 3. Array-valued story fields

- `tasks set-deps <id> <csv>` and `tasks set-deps-rfc <id> <csv>` — built directly
  on the block editor, with the same dependency-existence and cycle checks the
  validator already runs.

### 4. Guardrails (the process fix)

- **Auto-finalize on merge (shipped):** the `auto-finalize-rfc` workflow finalizes
  any `0000-*`/`draft-*` placeholder the instant it lands on `main` and pushes the
  renamed result — finalize is no longer a remembered human step (landed ahead of
  this RFC in #24). The `ci-guard-no-placeholder-on-main` story is closed without
  implementation — a backstop guard could only false-alarm against the
  self-healing push or duplicate a failure mode the visible `0000-*` dir
  already surfaces.
- **`validate()` as a library:** refactor `validate.mjs` so its core is an
  importable function returning structured errors (today it `process.exit`s). The
  CLI calls it _before_ commit so `new-rfc` and friends fail fast with a clear
  message, rather than producing a commit the pre-commit hook then rejects.

### 5. Story and RFC bodies

`refine` already commits arbitrary edited **story** content (body + arrays) from a
worktree and needs no change. But there is **no path for an RFC README body** —
the Summary / Motivation / Design prose — which would leave the "no hand-editing"
goal unmet for the most common authoring task. Two complementary additions close
it: `tasks edit <id-or-rfc-slug>` opens `$EDITOR` on a temp copy of a story **or
an RFC README** and commits via a mutator, and `tasks new-rfc --body-file <path>`
seeds an RFC body non-interactively at creation. Together with §2 they make RFC
authoring — frontmatter **and** body — require no hand-edits.

## Alternatives considered

- **`js-yaml` round-trip for frontmatter:** rejected — reflows the file and strips
  the template's inline comments; produces noisy, lossy diffs.
- **Leave RFC authoring/finalize as scripts:** rejected — the skippable manual
  finalize is precisely what corrupted `main`; scripts that aren't commands get
  forgotten.
- **Fold PR create/merge into the CLI:** rejected (out of scope) — that couples
  planning data to GitHub mechanics. PR orchestration stays with `gh` / btwhooks.

## Rollout

1. **frontmatter-editor** — `frontmatter-block-editor` (keystone; unblocks 3 & 4).
2. **rfc-commands** — `cli-new-rfc`, `cli-finalize-rfc`, `cli-rfc-edit` (the last
   depends on the block editor for its array flags).
3. **story-fields** — `cli-set-deps` (depends on the block editor).
4. **guardrails** — `validate-as-library` (independent; land any time).
   `ci-guard-no-placeholder-on-main` closed without implementation
   (superseded by auto-finalize, #24).
5. **story-fields** — `cli-edit-story-body` (story + RFC body editing; required
   for the "no hand-editing bodies" scope, independent of the rest).

## Open questions

1. **`tasks rfc` surface.** One multi-flag `rfc` command vs. several verbs
   (`rfc-status`, `rfc-relate`, …). Recommendation: a single `rfc <slug>` command
   with flags, matching how `priority` / `block` already overload one verb.
2. **Block-editor scope.** Limit it to replacing inline `[a, b]` flow arrays and
   simple indented block lists (which is all this repo's frontmatter uses), or
   handle arbitrary nesting? Recommendation: support flow + simple block lists
   only; reject anything deeper, consistent with the current defensive posture.

## Changelog

- 2026-06-12: closed ci-guard-no-placeholder-on-main without implementation — superseded by auto-finalize (#24)
- 2026-06-11: initial RFC — eliminate hand-editing of the tasks repo by extending
  the `pnpm tasks` CLI; surfaced while cleaning up after a skipped-finalize
  incident that left a `0000-` placeholder on `main`.
- 2026-06-12: review pass — extend `cli-edit-story-body` to cover RFC README
  bodies (+ `new-rfc --body-file`) so the "no hand-editing bodies" scope is
  actually met; point the CI guard's remediation at the existing
  `scripts/finalize-rfc.mjs` so it stays landable before `tasks finalize` exists.
- 2026-06-12: auto-finalize shipped (#24) — `cli-finalize-rfc`'s intent now runs
  as a push-to-main GitHub Action. Reframed `ci-guard-no-placeholder-on-main` from
  primary mechanism to a backstop that never races the self-healing finalize push.
