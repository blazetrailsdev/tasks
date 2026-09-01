---
title: "ci-suite-coverage-guard-misses-prefix-named-packages"
status: done
updated: 2026-09-01
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7323
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`register-rack-session-in-ci-lanes` asked, as an acceptance criterion, whether
`scripts/ci-suite-coverage.test.ts` would have caught the defect it fixed. It
does not, and the gap is structural.

The package half of the guard —
`it("covers each package test suite with a ci.yml vitest filter")`,
`scripts/ci-suite-coverage.test.ts:483-501` — collects the `pnpm vitest run`
filters out of ci.yml and asks only

```ts
if (!filters.some((filter) => dir.startsWith(filter.replace(/\/$/, "")))) {
```

Two things are wrong with that for a package whose name is a prefix-extension
of another's:

1. **`startsWith` is a string prefix, not a path prefix.**
   `"packages/rack-session".startsWith("packages/rack")` is `true`, so the
   `packages/rack` filter "covers" rack-session for free. Verified directly: with
   `packages/rack-session/src/*.test.ts` present and the lane registration
   reverted (`RACK_PKGS_RE='^packages/(rack|activesupport|date)/'`, Leaf Tests
   step back to `pnpm vitest run packages/rack`), the whole suite still passes
   20/20.

2. **The package check never consults the gate.** The tooling half has a
   companion test — `it("matches every unit-tests filter against the gate that
runs the job")`, `:507-519` — that probes each filter against
   `UNIT_TESTS_PKGS_RE`, precisely because a filter inside a gated job is dead
   when the gate does not fire. The package half has no such companion, so a
   package can be filtered by a job that its own changes never wake. That is
   exactly the rack-session defect: `UNIT_TESTS_PKGS_RE` fired,
   `RACK_PKGS_RE` did not, and the leaf-tests job that holds the filter was
   skipped.

Note that (1) alone masks (2) here: even a gate-aware package check would have
passed while `packages/rack` counted as covering rack-session.

## Acceptance criteria

- The package check matches on a path boundary, not a bare string prefix — a
  filter covers `packages/<p>` only when it is that dir or an ancestor of it.
- Each package filter is additionally probed against the gate of the job it
  lives in, the way the unit-tests filter check at `:507-519` already does, so a
  package filtered by a job its own paths cannot wake is a failure.
- Regression proof: with the two ci.yml lines of PR (this bundle's PR) reverted
  and a `packages/rack-session/**/*.test.ts` present, the suite FAILS. Assert
  this in-suite over a synthetic ci.yml fixture rather than by hand.
- No entry added to `KNOWN_UNRUN`.
