---
title: "conformance-triage-burndown-batch-2"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

Continuation of `conformance-triage-burndown` (RFC 0086). That story's first
batch dispositioned 11 rows: 6 signed off in
`scripts/prism-codegen/convergence-signoff.json` (aliasTracker,
isAlreadyInScope, findTakeWithLimit, \_raiseReadonlyRecordError,
\_raiseRecordNotTouchedError, realInheritanceColumn) and 5 filed as
0023-surfaced-deviations stories (`relation-load-records-drops-freeze`,
`flattened-args-drops-rails-hash-arm`,
`process-select-args-adds-nil-drop-branch`,
`composite-query-constraints-list-drops-memo`,
`cache-key-with-version-arg-and-order`).

`pnpm codegen:score --guard` now reports **357 unreviewed residue rows**. The
batch size is bounded by the PR LOC ceiling, not by the scorer: each sign-off is
a ~5-line reason and each filed deviation needs the Rails and port `file:line`
read first, so ~10-15 rows per PR is the sustainable rate.

The mechanics are settled — see the first batch's PR for the exact loop:

1. `pnpm codegen:score --verbose` and read the gen/port skeleton pair.
2. Read both bodies (`vendor/rails/…` and the port) before judging.
3. Benign (spelling, ivar name, constant path, Ruby idiom with no TS spelling)
   → append to `convergence-signoff.json` **and** delete the matching row from
   `convergence-baseline.json` by hand (only-shrink; never `--guard --write`).
4. Real divergence → `pnpm tasks new 0023-surfaced-deviations <slug>` with the
   Rails and port `file:line` captured in the body; leave the baseline row.
5. `pnpm codegen:score --guard` must end green.

## Acceptance criteria

- A further batch of residue rows dispositioned as sign-off or filed deviation.
- `pnpm codegen:score --guard` green, with the baseline strictly smaller.
- Residual rows counted in the PR body so the next batch knows where it stands.
