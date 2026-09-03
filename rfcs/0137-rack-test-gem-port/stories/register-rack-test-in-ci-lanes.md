---
title: "Register rack-test in the CI lanes"
status: draft
updated: 2026-09-03
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: ["rack-test-package-skeleton"]
deps-rfc: []
est-loc: 80
priority: 4
pr: null
claim: null
assignee: null
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

## Acceptance criteria

- [ ] All four `ci.yml` registrations landed.
- [ ] `pnpm vitest run scripts/ci-suite-coverage.test.ts` is green, and its
      assertion actually distinguishes `rack`, `rack-session` and `rack-test`
      rather than prefix-matching one for another.
- [ ] `pnpm vitest run packages/rack-test` runs the package's suite standalone.
