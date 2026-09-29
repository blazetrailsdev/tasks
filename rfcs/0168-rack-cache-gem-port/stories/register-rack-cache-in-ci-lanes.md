---
title: "Register rack-cache in the CI lanes"
status: draft
updated: 2026-09-29
rfc: "0168-rack-cache-gem-port"
cluster: null
packages: ["rack-cache"]
deps: ["rack-cache-package-skeleton"]
deps-rfc: []
est-loc: 60
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 4 of the RFC, parallel with `enroll-rack-cache-in-compare-tooling`.
`register-rack-test-in-ci-lanes` (RFC 0137) is the precedent. On `main` today:

- `.github/workflows/ci.yml:118`:
  `RACK_PKGS_RE='^packages/(rack|rack-session|rack-test|activesupport|date)/'`
  gains `rack-cache`.
- `.github/workflows/ci.yml:857`: the "Rack tests" step,
  `pnpm vitest run packages/rack packages/rack-session packages/rack-test`,
  gains `packages/rack-cache`.
- `.github/workflows/ci.yml:940`: the non-AR coverage list gains
  `packages/rack-cache`.

Two lanes follow from the consumers. They are needed only once those consumers
import the package, but they are cheap and nothing else gates them:

- `.github/workflows/ci.yml:113` `AP_PKGS_RE` gains `rack-cache`, because
  `port-rails-meta-and-entity-stores` makes actionpack's `http/rack-cache.ts`
  subclass it.
- `.github/workflows/ci.yml:115` `TRAILTIES_PKGS_RE` gains `rack-cache`, because
  `default-middleware-stack-omits-rack-cache` mounts it.

**The skeleton may already have landed the first three.**
`scripts/ci-suite-coverage.test.ts` turned `rack-test-package-skeleton` red the
moment `packages/rack-test` held a test, and #7453 landed them early. If
`rack-cache-package-skeleton` did the same, this story is the `AP_PKGS_RE` /
`TRAILTIES_PKGS_RE` pair only.

`rack-cache` is a fourth `rack`-prefixed package. `register-rack-test-in-ci-lanes`
found two things. The prefix fix
(`ci-suite-coverage-guard-misses-prefix-named-packages`) generalizes. But the
guard's own fixture strings in `scripts/ci-suite-coverage.test.ts` embed the
literal `run: pnpm vitest run packages/rack packages/rack-session …` line, and
appending to it makes the fixture's `.replace` a no-op, which turns
`"reports a package a prefix-named sibling's filter appears to cover"` red.
That note predicted this story would hit it.

The Dalli store suites need a memcached server and skip without one, as the
Ruby suite does (`vendor/rack-cache/v1.17.0/test/test_helper.rb:44-64`).
Adding a memcached service to CI is out of scope (RFC Non-goals).

## Acceptance criteria

- [ ] All five `ci.yml` registrations land (or the remainder, if the skeleton
      landed some).
- [ ] `pnpm vitest run scripts/ci-suite-coverage.test.ts` is green, and its
      prefix assertion still distinguishes all four `rack*` packages.
- [ ] `pnpm vitest run packages/rack-cache` runs the package's suite on its own.
- [ ] `INFRA_RE` is unchanged and no `KNOWN_UNRUN` entry is added.
