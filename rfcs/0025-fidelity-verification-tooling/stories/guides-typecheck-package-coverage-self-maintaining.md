---
title: "guides-typecheck package coverage is hand-maintained and reds main on every new package"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by make-new-package-registration-self-maintaining (2026-08-17 sweep): merged with guard-new-package-website-vite-aliases. validatePackageCoverage verified still at scripts/guides-typecheck/check.ts:147; citations carried forward."
---

## Context

`validatePackageCoverage()` in `scripts/guides-typecheck/check.ts:147-175` scans
`packages/*/package.json` and hard-fails if any `@blazetrails/*` package (except
`@blazetrails/website`) is absent from `scripts/guides-typecheck/package.json`
`dependencies`. The dep list is maintained by hand, so **every new package reds
`Guides Code Type Check` on main** until someone lands a one-line follow-up.

This has now happened at least twice with the identical failure text:

- #5976 — `@blazetrails/i18n`
- #6142 — `@blazetrails/date` (added by #6139); main was red for two consecutive
  runs (`6a7f11521`, `c21797b26`) before the fix landed.

The job is off on PRs by default (`.github/workflows/ci.yml:461-476` gates on the
`run-guides` label), so the package-adding PR is green and only the push-to-main
run goes red — the failure always lands on `main`, never on the PR that caused it.

No Rails counterpart: this is repo build tooling.

## Acceptance criteria

Adding a new `packages/<name>` with a `@blazetrails/*` name no longer reds
`Guides Code Type Check`. Either:

- the coverage requirement is satisfied automatically (e.g. the check writes /
  derives the dep set rather than asserting a hand-maintained one), or
- the requirement is enforced at the point of package creation — a lint or a
  `changes`-triggered gate that runs on the PR that adds the package, so the
  failure lands on that PR instead of on `main`.

Whichever shape is chosen, `pnpm guides:typecheck` must still fail loudly if a
guide code block imports a package it cannot resolve — the original purpose of
the check.

## Definition of done

- A new workspace package added without touching
  `scripts/guides-typecheck/package.json` does not red main.
- A regression cover that fails on the current baseline.
