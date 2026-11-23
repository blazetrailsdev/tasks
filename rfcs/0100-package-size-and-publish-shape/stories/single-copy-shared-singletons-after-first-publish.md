---
title: "Verify one ruby-compat/activesupport copy from a registry install of two published packages"
status: blocked
updated: 2026-11-23
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps:
  - first-alpha-practice-publish
deps-rfc: []
est-loc: 60
priority: 9
pr: null
claim: null
assignee: null
blocked-by: "needs first 0.1.0-alpha0.N practice publish (release.yml on a v* tag); npm view @blazetrails/activerecord 404s on 2026-11-23 — nothing published yet"
closed-reason: null
---

## Context

`exact-internal-pins-on-publish` (trails#10634) acceptance criterion 3 asked for a
test install of two packed packages, checking that `ruby-compat` and
`activesupport` (runtime-shared singletons: `instanceof`, `Symbol.for` brands,
`TopLevel` seats) install once. It could not run: packed tarballs' internal
`@blazetrails/*` deps resolve from the registry, and nothing is published yet.
trails#10634 verified only that `pnpm pack` of `activerecord` rewrites
`workspace:*` to exact `0.1.0-alpha0` pins.

## Acceptance criteria

- After the first `0.1.0-alpha0.N` practice publish (`.github/workflows/release.yml`),
  a fresh project installs `@blazetrails/activerecord` and `@blazetrails/actionpack`
  at that version, and `node_modules` holds exactly one copy of
  `@blazetrails/ruby-compat` and `@blazetrails/activesupport`
  (`pnpm why` / `npm ls` output recorded in the PR).
- The check runs in the release workflow after publish, or as a script the
  README "Versioning and releases" section names.
