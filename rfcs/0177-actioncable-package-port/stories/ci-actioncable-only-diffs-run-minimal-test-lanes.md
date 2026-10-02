---
title: "CI: an actioncable-only diff runs only the lanes it can affect"
status: draft
updated: 2026-10-02
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["scripts"]
deps: []
deps-rfc: []
est-loc: 350
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

About 35 of this RFC's stories touch only `packages/actioncable/**`. What
such a diff triggers is decided by the `changes` job in
`.github/workflows/ci.yml` (`:57` onward), whose gate rationale is kept in
`scripts/ci-suite-coverage.test.ts` ("Gate reference").

RFC 0171 solved the same problem for Thor, and both of its stories are done:
`0171/ci-thor-only-diffs-run-minimal-test-lanes` (trails#8284) and
`0171/ci-thor-only-diffs-scope-rails-comparison-to-thor` (trails#8337). What
they left in the tree:

- `scripts/ci/thor-only.sh` (9 lines): sets `thor_only=true` when **every**
  changed path matches `THOR_ONLY_RE`. It is called from the `filter` step
  (`ci.yml:302`) and exported as a job output (`:74`).
- `thor_only` arms on virtualized-dx-type-tests (`:773`), Unit Tests
  (`:806,815,859`), leaf-tests (`:890,920`) and Trailties Tests
  (`:950,952`), and in the `ci` aggregator (`:2333`, `:2452`).
- The gate reference for `thor_only` in `ci-suite-coverage.test.ts:436-467`
  and its scenario test (`:1295`).

This story adds the same scoping for Action Cable. It is a root: it lands
before the lib chain, and `port-actioncable-namespace-and-internal-constants`
depends on it.

**Design.** Generalize, do not copy. `thor-only.sh` becomes one script that
answers for a list of scoped packages (thor and actioncable today), each with
its own path set, and emits one output per package (`thor_only`,
`actioncable_only`). The actioncable-only set is:

- `packages/actioncable/**`;
- `scripts/parity/unported-files/actioncable.ts`.

There are no actioncable shards under `call-mismatches-exclude/` or
`call-mismatches-unreviewed/` to list: the RFC's parity plan admits none.
`vendor/rails/**` is **not** in the set; it is shared with every Rails
package.

Any other path, including `INFRA_RE` and `packages/trailties/**`, leaves
`actioncable_only=false` and today's gates apply unchanged. Schedule,
`workflow_dispatch` and push to main never set it.

When `actioncable_only` is true:

- The actioncable test step (the one `actioncable-package-skeleton` adds
  behind `ACTIONCABLE_PKGS_RE`) runs. Its PostgreSQL and Redis steps, added
  later by `port-actioncable-postgresql-adapter-tests-and-ci-lane` and
  `port-actioncable-redis-adapter-live-tests-and-ci-service`, are actioncable's
  own tests and run too.
- **Trailties Tests** runs `pnpm vitest related --run <changed files>` scoped
  to `packages/trailties`, as the thor arm does (`:952`). Before
  `port-actioncable-engine` that selects nothing; after it, it selects the
  trailties tests that import the changed module.
- **virtualized-dx-type-tests** and the leaf-tests DX step are skipped.
  Action Cable has no DX-type surface.
- **Unit Tests** runs only the tree-scanning guards whose result a
  `packages/` file can change, the set the thor arm already keeps (`:859`).
- The `ci` aggregator's skip arms accept each of these skips only when
  `actioncable_only` is true.

## Fidelity traps (predicted at authoring)

- [ ] **The `filter` step is at GitHub's inline-script size limit.** Crossing it fails the whole workflow at startup with no checks reported. Add nothing inline beyond the script call; the logic goes in `scripts/ci/`.
- [ ] **The aggregator fails on an unexpectedly skipped job.** Every new skip needs its arm, and each arm must be conditional on the package's own flag, not on either flag.
- [ ] **Two flags, never both.** A diff touching thor and actioncable files is neither thor-only nor actioncable-only and runs the full matrix. Test it.
- [ ] **Dependents are selected by import, not skipped.** Once trailties imports actioncable, an actioncable-only diff can break trailties tests. `vitest related` is what catches it; a plain skip of Trailties Tests would not.
- [ ] **`actioncable-package-skeleton` edits the same workflow** (its own gate and test step). Whichever lands second rebases; this story must not assume the package directory exists, and its tests use synthetic diffs.
- [ ] **Stories that touch a shared register** (`vendor/sources.ts`, `scripts/parity/conventions.ts`, a mark file, `eslint.config.mjs`, CLAUDE.md) are not actioncable-only and get the full matrix. That is correct; do not widen the set to cover them.
- [ ] **`ci-suite-coverage.test.ts` executes the gate block verbatim** and has fixture literals that `.replace()` specific lines, including the thor-only call (`:494,542`). Renaming the script moves those.

## Acceptance criteria

- [ ] One script under `scripts/ci/` answers for both scoped packages; `thor_only` behaves exactly as before, and the existing thor scenarios pass unchanged.
- [ ] `scripts/ci-suite-coverage.test.ts` covers `actioncable_only`: an actioncable-only diff; an actioncable diff plus one trailties file (full matrix); plus `pnpm-lock.yaml` (full matrix); plus a thor file (full matrix); and a push event (full matrix).
- [ ] The gate reference documents `actioncable_only`, and the `filter` step grew only by the script call.
- [ ] No job is skipped for a diff outside the actioncable-only set.
- [ ] Before/after wall-clock and billed minutes for one real actioncable-only PR are recorded in the PR body of the first lib story that lands after this one.

## Definition of done

A `paths-ignore`, a second copy of `thor-only.sh`, or a skip that also applies when a non-actioncable file changes, does not close this story.

## Verification

```bash
pnpm vitest run scripts/ci-suite-coverage.test.ts
bash scripts/ci/thor-only.sh 'packages/trailties/src/thor/base.ts'   # unchanged: thor_only=true
wc -c .github/workflows/ci.yml   # the filter step grew only by a script call
```
