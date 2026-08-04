---
title: "Simplify buildBundlePrompt to a single claim/done now that the verbs are variadic"
status: done
updated: 2026-08-04
rfc: "0024-tasks-cli-coverage"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 0
claim: "2026-08-04T18:00:52Z"
assignee: "simplify-bundle-prompt-to-single-claim"
blocked-by: null
closed-reason: null
---

## Context

PR #6073 (story `multi-id-story-status-verbs`) made the story-status verbs
variadic and added the missing inverse:

```text
pnpm tasks claim <id...> [--assignee <name>]
pnpm tasks release <id...>
pnpm tasks in-progress <id...> --pr <N>
pnpm tasks done <id...> --pr <N>
```

`claim` is now all-or-nothing across its ids — the whole batch is partitioned by
`claimState` against the post-pull state before any write (`scripts/tasks/cli.ts`,
`claimBatch` / `claim`), so a lost race on one id refuses the lot and writes
nothing.

The spawn loop's bundle prompt still hand-rolls the compensation that made
necessary. `buildBundlePrompt` in btwhooks instructs the agent to:

> FIRST, claim EVERY story in the bundle [...] If ANY claim reports
> already-claimed or a lost race, release any you already claimed, STOP and
> exit — another agent has part of this bundle.

That is a distributed transaction written as prose, and the release step it asks
for did not exist until #6073. An agent that dies partway through the claim loop
leaves the earlier stories `claimed` with no worker behind them: invisible to
`ready` (not ready) and to the daily merge sweep (no PR), i.e. silently dropped
from the backlog. `i18n-backend-key-value` was found stranded exactly this way.

## Acceptance criteria

- [ ] `buildBundlePrompt` emits a SINGLE `pnpm tasks claim <id1> <id2> ...
--assignee <name>` call instead of one per story, and a single
      `pnpm tasks done <id...> --pr <N>` at the end.
- [ ] The "release any you already claimed, STOP and exit" compensation
      paragraph is deleted — the CLI is atomic now, so there is nothing to
      compensate. The prompt still tells the agent to STOP and exit on a
      non-zero claim exit.
- [ ] `pnpm tasks release <id...>` is named in the prompt as the recovery path
      for a claim the agent decides to hand back mid-flight.
- [ ] A bundle spawn is exercised end to end (or its prompt snapshot updated) so
      the generated text is verified, not just hand-edited.

## Notes

This lands in the btwhooks repo, not trails; it is filed here because it is the
follow-on the `multi-id-story-status-verbs` story named and it is only unblocked
now that #6073 has merged.
