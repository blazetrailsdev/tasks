---
title: "Variadic story-status verbs: claim/in-progress/done/release take many ids atomically"
status: done
updated: 2026-08-04
rfc: "0024-tasks-cli-coverage"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6073
claim: "2026-08-04T17:01:16Z"
assignee: "multi-id-story-status-verbs"
blocked-by: null
closed-reason: null
---

# Variadic story-status verbs

## Context

Every story-status verb (`claim`, `in-progress`, `done`, `block`, `close`)
routes through `flip()` → `commitAndPush()`, which takes **one** story id and
does a full round-trip per call:

    fetch origin/main → ahead-check → acquire the GLOBAL tasks lock
    → pull --rebase → edit frontmatter → commit → push (with race retry)
    → release

That lock (`acquireTasksLock`) serializes every agent on the machine, not just
the caller. It is fine for one story at a time, which is all the CLI was built
for.

Bundle mode broke that assumption. A bundle is one worker implementing N
stories in a single PR, so it must claim N stories up front and mark N done at
the end — `2N` serialized lock+push round-trips for what is logically two
operations. A 5-story bundle takes the global lock 10 times, contending with
every other live worker each time.

The worse problem is atomicity. There is no multi-claim, so the spawn loop's
bundle prompt hand-rolls compensation:

> FIRST, claim EVERY story in the bundle [...] If ANY claim reports
> already-claimed or a lost race, release any you already claimed, STOP and
> exit — another agent has part of this bundle.

That is a distributed transaction implemented as prose. If the agent loses the
race on story 3, or simply dies between claims, stories 1–2 stay `claimed` with
no worker behind them. A story in that state is invisible to everything: not
`ready`, so the spawn loop will never re-pick it; not `in-progress` with a PR,
so the daily merge sweep skips it too. It is silently dropped from the backlog.

This is not hypothetical — `i18n-backend-key-value` was found stranded exactly
this way (claimed 01:40, no PR, no worktree, no pane) and had to be released by
hand.

And the release step the prompt asks for **does not exist**. `claim` is
one-way: `STATUS_TRANSITIONS.claimed` is `[]`, so `status-set` refuses with
exit 2, and `ready` is a read-only listing verb. Recovering a stranded claim
today means hand-editing frontmatter — which is precisely what this RFC set out
to eliminate.

## Proposal

Make the story-status verbs variadic, mutating all named stories in **one
commit under one lock**:

    pnpm tasks claim <id...> --assignee <name>
    pnpm tasks in-progress <id...> --pr <N>
    pnpm tasks done <id...> --pr <N>

and add the missing inverse:

    pnpm tasks release <id...>     # claimed → ready, clearing claim + assignee

`claim` must be all-or-nothing: validate every id (exists, and is in a legal
source status) **before** any write, so a bundle either claims cleanly or
claims nothing and the compensation dance disappears from the prompt.

`done` and `in-progress` should be per-id best-effort — an id already `done`
must not abort the rest, since a half-marked bundle behind a merged PR is the
failure this is meant to prevent.

The change looks contained: `flip()` is a single function, and
`commitAndPush()` takes one `fileToStage: string` that becomes a list (its
`git add` at cli.ts:1224 already handles the `-A` case).

## Acceptance criteria

- `claim`, `in-progress`, `done`, and the new `release` accept one or more ids;
  a single id behaves exactly as today (no caller breakage).
- N ids produce exactly ONE commit and ONE push, taking the global lock once.
- `claim` is atomic: if any id is missing or not claimable, nothing is written
  and the exit code still distinguishes a lost race (3) from other failures.
- `in-progress` / `done` attempt each id independently and report per-id
  outcomes; one skip does not abort the rest.
- `release` moves `claimed → ready` and clears `claim` + `assignee`; it is a
  no-op (exit 0) on a story that is already `ready`.
- Commit messages name all ids (e.g. `done: a, b, c #6062`).
- Tests in `cli.test.ts` cover: multi-id success, partial-failure atomicity for
  `claim`, per-id resilience for `done`, and `release` round-tripping a claim.

## Follow-on

Once the verbs land, simplify the spawn loop's bundle prompt
(`buildBundlePrompt` in btwhooks) to a single `claim` and a single `done`
call, and delete the "release any you already claimed" paragraph.
