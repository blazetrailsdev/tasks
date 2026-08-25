---
title: "Fresh worktrees fail their first parity:api now that unbuilt packages are a hard error"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-fidelity divergence: worktree-setup DX for a parity tool guard, no trails/Rails behavior difference. RFC 0023 is for port-discovered deviations only."
---

## Context

PR #5662 made `staleBuilds` (`scripts/api-compare/build-freshness.ts`) report a
project with no `dist` as `NotBuilt`, so `extract-ts-api.ts:218` aborts the run.
That is deliberate — an unbuilt tree silently prints different advisory totals
than the same tree after `pnpm build` (option keys 103 pairs vs 104; the pair is
activerecord `serializableHash`, whose options type resolves through
`packages/activemodel/dist/*.d.ts`).

The consequence: `scripts/start-worktree.sh` does NOT run `pnpm build` (grep for
"build" finds only an unrelated comment at line 246), so a freshly created
worktree's FIRST `pnpm parity:api` now fails with the guard's message. It is a
clear, actionable message naming `pnpm build`, so nobody is stuck — but every
agent that runs parity:api before building burns a turn on it, and that is a
predictable, repeated cost.

## Acceptance criteria

- Decide between: (a) `start-worktree.sh` runs `pnpm build` as part of worktree
  setup, so parity:api works on the first try; or (b) leave setup alone and
  accept the guard's message as the contract, documenting it in CLAUDE.md /
  CONTRIBUTING so agents build first without discovering it by failing.
- If (a): confirm it does not materially slow worktree creation, and that a
  build failure during setup surfaces clearly rather than leaving a half-set-up
  worktree.
- Do NOT weaken the guard — the totals it protects are the whole point of #5662.
