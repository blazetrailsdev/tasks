---
title: "solid-cache-install-generator-writes-cache-yml"
status: draft
updated: 2026-11-25
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`SolidCache::InstallGenerator#copy_files`
(`vendor/solid_cache/v1.0.9/lib/generators/solid_cache/install/install_generator.rb:6-7`)
writes `template "config/cache.yml"`. The port
(`packages/solid-cache/lib/generators/solid-cache/install/install-generator.ts`,
`copyFiles`) writes `config/cache.ts` from a `cache.ts.tt` template. Surfaced
when solid_cache's `lib/./generators` joined `extraLibPaths` (bundle PR for
`generator-class-paths-for-remaining-gem-generators`); receipted
`@missingRailsArgs template — CONVERGEABLE` pointing here. Sibling of
`solid-cable-install-generator-writes-cable-yml`.

## Acceptance criteria

- The install generator writes `config/cache.yml` from a `cache.yml` template,
  and the app's cache config reader reads it as Rails does.
- The `@missingRailsArgs template` receipt is removed and
  `pnpm parity:api:calls:args` stays green.
