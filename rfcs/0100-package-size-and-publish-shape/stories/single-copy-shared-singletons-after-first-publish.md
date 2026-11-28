---
title: "Verify one ruby-compat/activesupport copy from a registry install of two published packages"
status: done
updated: 2026-11-28
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps:
  - first-alpha-practice-publish
deps-rfc: []
est-loc: 60
priority: 8
pr: trails#10856
claim: "2026-11-28T01:09:28Z"
assignee: "trailmap-installs-published-packages-from-npm"
blocked-by: null
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
