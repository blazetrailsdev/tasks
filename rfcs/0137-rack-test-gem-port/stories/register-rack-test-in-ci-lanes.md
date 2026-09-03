---
title: "Register rack-test in the CI lanes"
status: done
updated: 2026-09-03
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: ["rack-test-package-skeleton"]
deps-rfc: []
est-loc: 80
priority: 4
pr: 7459
claim: "2026-09-03T20:37:20Z"
assignee: "enroll-rack-test-in-compare-tooling"
blocked-by: null
closed-reason: null
---

## Context

Story 4 of the RFC, parallel with `enroll-rack-test-in-compare-tooling`.
`register-rack-session-in-ci-lanes` (RFC 0133) is the precedent; rack-test needs
one registration more than it did.

The three rack-session touched:

- `.github/workflows/ci.yml:118` —
  `RACK_PKGS_RE='^packages/(rack|rack-session|activesupport|date)/'` gains
  `rack-test`, so a change under `packages/rack-test/` marks `rack_affected`.
- `.github/workflows/ci.yml:733` — the "Rack tests" step,
  `pnpm vitest run packages/rack packages/rack-session`, gains
  `packages/rack-test`.
- `.github/workflows/ci.yml:814` — the non-AR coverage list.

The fourth, which rack-session did not need:

- `.github/workflows/ci.yml:112` —
  `AP_PKGS_RE='^packages/(actionpack|actionview|activemodel|activesupport|rack|date|did-you-mean)/'`
  gains `rack-test`. `packages/actionpack` takes a dependency on
  `@blazetrails/rack-test` in `rack-test-package-skeleton` and its stand-ins
  collapse onto the gem in the two collapse stories, so a rack-test change can
  break actionpack's suite. Omitting this would let a rack-test-only PR skip
  the lane that catches it.

**The suite runs in the default path.** rack-test is a testing library but it is
a published runtime package (RFC "Published, not devDependency-only"), and its
234 gem tests are the fidelity measure the RFC exists to buy. There is no
"test-only package, skip its tests" carve-out and none is invented here.

`scripts/ci-suite-coverage.test.ts` is the gate that checks a package appears in
some lane, and it had exactly this hazard once already: a prefix-matching bug
that let `rack` satisfy the assertion for `rack-session`, fixed by
`0133-rack-session-gem-port/ci-suite-coverage-guard-misses-prefix-named-packages`
(**status `done`**). `rack-test` is a third `rack`-prefixed package, so confirm
that fix generalizes to three rather than assuming it does — the failure mode is
a silently-green guard, not a red one.

**Three of the four already landed in #7453** (the skeleton story's PR), because
`scripts/ci-suite-coverage.test.ts` turned that PR red the moment
`packages/rack-test` existed with a test in it: `RACK_PKGS_RE` (`:118`), the
"Rack tests" step (`:733`) and the coverage list (`:815`, shifted by one). What
remains for this story is the fourth — **`AP_PKGS_RE` (`:112`)** — which nothing
gates, since actionpack's dependency on `@blazetrails/rack-test` is a
`package.json` edge the coverage guard does not read.

Two findings from that forced pass, both good news for the paragraph below:

- The prefix fix **does** generalize to three `rack`-prefixed packages. The
  guard reported `packages/rack-test` as uncovered rather than letting
  `packages/rack`'s filter satisfy it, so the hazard this story warns about did
  not recur.
- Registering the package **also** required editing the guard's own synthetic
  fixture strings in `scripts/ci-suite-coverage.test.ts`, which embed the
  literal `run: pnpm vitest run packages/rack packages/rack-session\n`.
  Appending to that line makes the fixture's `.replace` a no-op and reds
  `"reports a package a prefix-named sibling's filter appears to cover"`. The
  `AP_PKGS_RE` edit does not touch that literal, so this story should not hit
  it — but a future fourth `rack` package will.

## Acceptance criteria

- [ ] All four `ci.yml` registrations landed.
- [ ] `pnpm vitest run scripts/ci-suite-coverage.test.ts` is green, and its
      assertion actually distinguishes `rack`, `rack-session` and `rack-test`
      rather than prefix-matching one for another.
- [ ] `pnpm vitest run packages/rack-test` runs the package's suite standalone.
