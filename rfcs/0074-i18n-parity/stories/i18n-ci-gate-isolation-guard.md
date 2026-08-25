---
title: "Pin i18n CI gate isolation so i18n-only changes never fan out to dependent suites"
status: done
updated: 2026-08-03
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
pr: 5998
claim: "2026-08-03T17:54:46Z"
assignee: "i18n-ci-gate-isolation-guard"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n` landed on `main` with #5969 (branch
`i18n-package-scaffold-config-exceptions`, story
`i18n-package-scaffold-config-exceptions`). That PR created
`@blazetrails/i18n` — package `packages/i18n`, source under
`packages/i18n/src/` (`config.ts`, `exceptions.ts`, partial `i18n.ts`,
`interpolate/ruby.ts`), **zero workspace dependencies** in
`packages/i18n/package.json` — and wired it into CI in three places:

- `.github/workflows/ci.yml:194` — `UNIT_TESTS_PKGS_RE` now reads
  `^(packages/(arel|activemodel|activesupport|i18n)/|...`, with the comment at
  `ci.yml:164` updated to name i18n as a leaf package.
- `.github/workflows/ci.yml:702` — `packages/i18n` added to the `unit-tests`
  job's `pnpm vitest run` filter list.
- `.github/workflows/ci.yml:833` — `packages/i18n` added to the (non-gating)
  Coverage job's package list.

Plus the root `tsconfig.json` project reference and the `@blazetrails/i18n`
alias in `vitest.config.ts`. That is the repo's three-registration rule for a
new test tree (vitest.config + a ci.yml vitest filter + membership in the gate
that runs the job holding that filter); `scripts/ci-suite-coverage.test.ts`
enforces the filter↔gate pairing.

### How the gates work

The `changes` job (`ci.yml:110-204` for the `*_RE` definitions,
`ci.yml:362-373` for the `set_gate` calls) derives one boolean output per
suite from the changed-file list:

| gate output             | regex                | ci.yml line |
| ----------------------- | -------------------- | ----------- |
| `activerecord_affected` | `AR_PKGS_RE`         | 127         |
| `db_adapter_affected`   | `DB_ADAPTER_RE`      | 134         |
| `actionpack_affected`   | `AP_PKGS_RE`         | 137         |
| `actionview_affected`   | `AV_PKGS_RE`         | 141         |
| `trailties_affected`    | `TRAILTIES_PKGS_RE`  | 146         |
| `rack_affected`         | `RACK_PKGS_RE`       | 161         |
| `unit_tests_affected`   | `UNIT_TESTS_PKGS_RE` | 194         |

`activesupport` is a member of nearly every one of those regexes, because it
is a runtime dependency of nearly every package. That is the central risk this
story guards: the moment `packages/i18n` is written into `AR_PKGS_RE` /
`AP_PKGS_RE` / `AV_PKGS_RE` / `TRAILTIES_PKGS_RE` / `RACK_PKGS_RE` — or is
wired such that it rides along with activesupport into them — an i18n-only
change fans out across the whole matrix (three AR DB jobs, actionpack,
trailties, leaf-tests), which is exactly the cost the package split exists to
avoid.

As of `main` today the isolation is **already correct in the forward
direction**: `packages/i18n/src/config.ts` matches only `UNIT_TESTS_PKGS_RE`,
so an i18n-only PR runs `unit-tests` and nothing else. Nothing pins that,
though — the invariant is currently an accident of which regexes happen not to
name i18n.

### `scripts/ci-suite-coverage.test.ts` mechanics

- `TOOLING_ROOTS = ["scripts", "eslint", "vendor"]` (`:28`) — `packages/` is
  deliberately excluded from the on-disk walk, so no existing assertion in this
  file says anything about `packages/i18n`.
- `gateRegex(yml, name)` (`:130`) lifts a named `*_RE` out of ci.yml by
  literal `NAME='...'` match and compiles it.
- `gateRunner(yml)` (`:145`) is the real mechanism to use here: it slices the
  `*_RE` definitions plus the `infra_files=$(` … `set_gate comparison_affected`
  region **verbatim** out of ci.yml, runs it under `set -euo pipefail` against
  a single changed path, and returns the full `Record<gateName, "true"|"false">`
  from `$GITHUB_OUTPUT`. Modelling the regexes in JS would miss shell-level
  faults.
- The existing `runs`/`skips` probe tests at `:207` (`guides_affected`) and
  `:243` (`db_adapter_affected`) are the pattern to copy: two path lists, one
  `Promise.all` over `runGate`, and an assertion in **both** directions
  (over-firing and under-firing are each pinned).
- The `unit-tests` filter↔gate test at `:190` asserts every positional filter
  in the `unit-tests` job is matched by `UNIT_TESTS_PKGS_RE` — this is what
  already covers the `packages/i18n` filter added at `ci.yml:702`, and it is
  what would fail if a future PR removed i18n from the gate but left the
  filter.
- `ci.yml:238` pins the `changes` job's inline `run:` script under 20,500
  characters (hard GitHub Actions expression limit; crossing it fails the
  entire workflow at startup with zero checks reported). Prose costs the same
  as code there — any comment this story adds belongs in
  `ci-suite-coverage.test.ts`, not in that step.

### Decision on scope (repo owner, this story's filing)

The standalone-`I18N_PKGS_RE` split was considered and **declined**. i18n stays
in `UNIT_TESTS_PKGS_RE` and in the shared `unit-tests` vitest invocation. The
accepted consequence is that an activesupport-only PR also runs the i18n suite
(they share one gate and one vitest invocation) — a small, bounded cost, and
activesupport is the package the consolidation stories will make a genuine
consumer of i18n anyway. This story is therefore **guard-only**: it does not
restructure the gates, it pins the isolation that exists so a later PR cannot
silently undo it.

## Acceptance criteria

1. An i18n-only change runs **only** the i18n suite's job. Add a probe test to
   `scripts/ci-suite-coverage.test.ts` (modelled on the `db_adapter_affected`
   test at `:243`) that runs `gateRunner` over at least
   `packages/i18n/src/config.ts`, `packages/i18n/src/exceptions.ts`, and
   `packages/i18n/src/i18n.ts`, and asserts for each:
   - `unit_tests_affected === "true"`, and
   - `activerecord_affected`, `actionpack_affected`, `actionview_affected`,
     `trailties_affected`, `rack_affected`, `db_adapter_affected`,
     `trails_tsc_affected`, `tse_compiler_affected`, `guides_affected` are all
     `"false"`.
2. i18n is absent from `AR_PKGS_RE`, `AP_PKGS_RE`, `AV_PKGS_RE`,
   `TRAILTIES_PKGS_RE`, and `RACK_PKGS_RE`. Assert this structurally too — for
   each of those five gate names, `gateRegex(yml, name).test("packages/i18n/src/config.ts")`
   is `false` — so the failure message names the gate that grew the membership
   rather than only the path that fanned out.
3. Include an anchor probe, as the `db_adapter_affected` test does at `:279`:
   none of the i18n paths may match when prefixed (`vendor/packages/i18n/...`),
   catching an alternation whose `^` covers only its first branch.
4. `packages/i18n` remains in `UNIT_TESTS_PKGS_RE` (`ci.yml:194`) and in the
   `unit-tests` vitest filter list (`ci.yml:702`) — the existing filter↔gate
   test at `ci-suite-coverage.test.ts:190` must keep passing, i.e. the two stay
   registered together.
5. `pnpm vitest run scripts/ci-suite-coverage.test.ts` passes.
6. The new assertions are compatible with the merged scaffold: package name
   `@blazetrails/i18n`, path `packages/i18n/`, sources under
   `packages/i18n/src/`. No product or CI restructuring — this story adds
   guard assertions (and, if needed, comments in the test file) only. In
   particular it must **not** grow the `changes` job's `run:` block (AC 3 of
   `ci.yml:238`'s limit).
7. A comment above the new test states the intended dependency direction (see
   below), so the next agent to touch these gates has the rule in front of
   them.

## Intended dependency direction

The rule, to be recorded in the new test's header comment:

- **Downstream (i18n → its consumers): allowed, and required once real.**
  Today `packages/i18n/package.json` declares no workspace dependencies and no
  package imports `@blazetrails/i18n`, so no dependent gate may name i18n. When
  the consolidation stories land — `i18n-consolidate-activesupport-shim` and
  `i18n-consolidate-activemodel-activerecord-shims`, which point
  activesupport / activemodel / activerecord at `@blazetrails/i18n` at runtime
  — i18n becomes a true upstream, and `i18n` **must** be added to the gates of
  every suite that then consumes it (`AR_PKGS_RE`, `AP_PKGS_RE`, `AV_PKGS_RE`,
  `TRAILTIES_PKGS_RE`, `RACK_PKGS_RE`, following exactly the membership
  `activesupport` already has). Those stories own that edit, and they own
  relaxing the AC-1/AC-2 assertions this story adds — the guard is written so
  that landing the consumption without updating the gates fails loudly rather
  than shipping an untested edge.
- **Upstream (consumers → i18n): never automatic.** A change to activesupport,
  activemodel, or activerecord must not be _specified_ as running the i18n
  suite. The one exception is incidental and accepted: activesupport shares
  `UNIT_TESTS_PKGS_RE` and the `unit-tests` vitest invocation with i18n, so
  activesupport PRs do run i18n tests today. That is a consequence of the
  shared leaf bundle, not a dependency claim, and nothing in this story should
  assert it as intended behaviour — a future split of i18n into its own gate
  must be free to remove it without touching these assertions.
