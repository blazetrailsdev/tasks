---
title: "next-bundle's prioritized lead can exceed --max-loc with no warning"
status: ready
updated: 2026-07-29
rfc: "0024-tasks-cli-coverage"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm tasks next-bundle` can return a bundle whose reported total exceeds its
own budget, with no warning. Observed on 2026-07-28 with the default budget:

```text
bundle (sum 450 / max 250):
id                                  rfc                     status  priority  est_loc
port-migration-change-schema-cases  0005-activerecord-gaps  ready   2*        450
```

Mechanism (`scripts/tasks/cli.ts`):

- `nextBundle` (`:477`) takes the prioritized path when any candidate has an
  effective priority. It sets `lead = prioritized[0]` (`:501`) and returns
  `[lead, ...fill]` (`:508`) — `lead` is never checked against `opts.maxLoc`.
- That is deliberate for the missing-estimate case: the comment at `:479-492`
  says a prioritized story leads "even when it has no est_loc (treated as 0 for
  the budget)". But the same unchecked path also admits a lead whose est_loc is
  far ABOVE the budget.
- The fill is correctly empty — `bestBundle(rest, opts.maxLoc - leadLoc)`
  (`:507`) gets a negative budget and returns `[]` at `:454` — so only the lead
  busts the budget, never the packing.
- The CLI (`:3118-3126`) then sums the rows and prints `sum 450 / max 250`
  without flagging that the invariant the line implies is violated. The
  `--json` shape (`:3121`) has the same problem: `bundle_total_loc` >
  `max_loc` with nothing to distinguish it from a well-formed bundle.

Why it matters beyond cosmetics: `--max-loc` is the scheduler's proxy for
CLAUDE.md's 500-LOC PR ceiling, and review-cycle data puts the pain inflection
at ~400 LOC. Silently handing an agent a 450-LOC lead under a "max 250" banner
is exactly the case the budget exists to prevent — the agent discovers it
mid-PR and splits by hand.

Note `no ready stories within ${maxLoc} LOC` (`:3124`) is only reachable on the
unprioritized path; with priorities set there is always a lead, so the message
never fires.

## Acceptance criteria

- [ ] Decide the intended contract and make the code and the printed banner
      agree. The likely shape: keep the priority-outranks-budget behavior (a
      prioritized story is an explicit "do this"), but make an over-budget lead
      VISIBLE — e.g. print `bundle (sum 450 / max 250 — lead exceeds budget)`
      and set a flag in the `--json` payload — rather than silently reporting a
      total above `max`.
- [ ] A story with no `est_loc` still leads and is still treated as 0, per the
      existing comment at `cli.ts:479-492` — that case is not the bug and must
      not regress.
- [ ] `--json` consumers can tell an over-budget bundle from a conforming one
      without re-deriving the sum themselves.
- [ ] Cover both in `scripts/tasks/cli.test.ts` alongside the existing
      `nextBundle` cases (`:339-353`): a prioritized lead above the budget, and
      a prioritized lead with a null `est_loc`.
- [ ] `pnpm tasks next-bundle` on the live index no longer prints a `sum` above
      `max` without saying so.
