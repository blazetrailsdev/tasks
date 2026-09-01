---
title: "Register packages/rack-session in the CI lane filters so its tests actually run"
status: done
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: ["rack-session"]
deps: ["rack-session-package-skeleton"]
deps-rfc: []
est-loc: 60
priority: 3
pr: 7322
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rack-session-package-skeleton` (PR #7319) creates `packages/rack-session/` but
registers it in **no CI lane**, so once it holds a test file that test will not
run. Found while reviewing #7319's checks.

**`packages/rack-session/` matches no package gate.** The changed-paths filter
in `.github/workflows/ci.yml` (the `changes` job, ~`:107-130`) derives every
lane flag from a per-package regex, and rack-session falls through all of them:

- `RACK_PKGS_RE='^packages/(rack|activesupport|date)/'` — does **not** match
  `packages/rack-session/`. After `rack` the regex demands `/` and the path has
  `-`. This is the trap: it reads as if it matches.
- No other `*_PKGS_RE` (`AP_PKGS_RE`, `AV_PKGS_RE`, `TRAILTIES_PKGS_RE`, …)
  names it either.
- `Leaf Tests` (`ci.yml:~675`) is where a cheap leaf suite belongs — it already
  runs rack — but its rack step is literally `pnpm vitest run packages/rack`,
  which does not collect `packages/rack-session`.

The one gate that does fire is `UNIT_TESTS_PKGS_RE='^(packages/|scripts/|…)'`,
which matches all of `packages/`. That sets `unit_tests_affected=true` — but the
`unit-tests` job runs an **explicit package list** (`arel`, `activemodel`,
`activesupport`, `date`, `i18n`, `ruby-compat`, plus the scripts suites) that
does not include rack-session. So the flag goes true and still no rack-session
test runs. A lane that is flagged-but-collects-nothing is worse than one that
skips: it reports green.

**Why #7319 is green anyway, and why the next story is not.**
`packages/rack-session/src/` currently holds only `index.ts` — no `*.test.ts` —
so there is nothing to miss yet. `scripts/ci-suite-coverage.test.ts` walks
`packages/` and fails when a package's suite is wired into no job (its header:
"A new scripts/\*\*/foo.test.ts now fails here until it's wired into a job"), so
it will red the **first** story that adds a rack-session test — most likely
`relocate-rack-session-scaffolding-out-of-actionpack` or
`port-rack-session-session-hash`. Doing the registration here means that story
sees a green baseline instead of an unrelated CI failure it has to diagnose from
scratch.

**Out of scope, deliberately.** #7319 also ran the entire matrix — every AR
adapter lane — because it touches `pnpm-lock.yaml`, root `tsconfig.json` and
`vitest.config.ts`, all three of which hit
`INFRA_RE` (`ci.yml:107`), which means "could affect anything". That is correct
by construction and unavoidable for **any** new-package PR, since registering a
workspace package necessarily edits all three. Narrowing `INFRA_RE` to
distinguish an additive package registration from a real config change is a
genuine design question about the filter, not part of this story; file it
separately if it is worth doing. Do **not** widen or weaken `INFRA_RE` here.

## Acceptance criteria

- [ ] `packages/rack-session/**` trips a package lane flag. Either extend
      `RACK_PKGS_RE` to cover it (`rack(-session)?`, or an explicit
      alternation — whichever reads less like the bug above) or give it its own
      `rack_session_affected` output. State which and why in the PR body; if
      rack-session is folded into the rack flag, note that a rack-session change
      then also runs the rack suite, which is correct since rack-session depends
      on rack.
- [ ] The `Leaf Tests` job actually collects the suite — its rack step becomes
      `pnpm vitest run packages/rack packages/rack-session`, or a sibling step
      gated on the new flag. Leaf Tests is the right home: rack-session is a
      small leaf and the job exists to amortize exactly this.
- [ ] Verify the wiring with a **real** test file rather than by reading the
      YAML: add or temporarily add a trivial `packages/rack-session/**/*.test.ts`
      and confirm from the job log that it is collected. A vitest glob that
      matches nothing exits 0 and looks identical to a passing suite (this has
      bitten before).
- [ ] `pnpm vitest run scripts/ci-suite-coverage.test.ts` passes, and — since
      that guard only judges packages that hold a test file — confirm it would
      have caught this by checking it fails with the test file present and the
      lane registration reverted. If it does not fail in that state, the guard
      has a gap and that gap is a finding worth its own story.
- [ ] No entry added to `KNOWN_UNRUN` in `scripts/ci-suite-coverage.test.ts`.
      That list "must shrink, never grow", and it is for suites deliberately not
      run in CI — not for a package whose lane nobody wired up.
- [ ] `INFRA_RE` unchanged.
