---
title: "Add an unported Rails file to TARGET_FILES so async inference is exercised end-to-end"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

PR #5821 taught the codegen to infer `async` for a Rails file with no
hand-written twin `.ts` (`inferAsyncFromBodies` in
`scripts/prism-codegen/async-source.ts`), gated on
`existsSync(twinTsAbs)` in `asyncMethodsForRailsFile`.

Every entry in `TARGET_FILES` (`scripts/prism-codegen/files.ts`) currently has
a twin `.ts` in `packages/activerecord/src`, so the new path is **inert for
the whole checked-in target set**: generated output for all 9 targets was
verified byte-identical to `origin/main` before and after that PR, and
`pnpm codegen:score` was unchanged at 33 matched / 297 divergent. The
inference is covered only by unit tests over synthetic Ruby, never end-to-end
through `generateTarget` / the golden snapshots.

That is the population codegen is most useful for, and it is exactly the
population no target exercises. Until a genuinely unported Rails file is in
`TARGET_FILES`, regressions in the inference path cannot show up in
`golden.test.ts` or in the score.

## Acceptance criteria

- At least one Rails file with no twin `.ts` is added to `TARGET_FILES` with a
  centrality rank and tractability rationale, chosen so its body actually
  reaches known-async manifest names.
- Its golden snapshot is checked in and shows `async` defs with `await` at the
  inferred call sites (i.e. the file is not all-sync).
- `pnpm codegen:score` reports the new file; the matched count for existing
  targets does not regress.
- Confirm the honest-limits note in
  `docs/infrastructure/prism-codegen-spike.md` still reads accurately once a
  real unported target exists.
