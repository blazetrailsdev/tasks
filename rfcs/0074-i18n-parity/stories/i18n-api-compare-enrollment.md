---
title: "Enroll i18n in api:compare"
status: ready
updated: 2026-07-26
rfc: "0074-i18n-parity"
cluster: null
deps: ["i18n-facade-translate-interpolate"]
deps-rfc: []
est-loc: 200
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Enroll i18n in api:compare (flip compareApi)

## Context

`vendor/sources.ts` i18n entry has `compareApi: false`. Flipping it makes
`apiComparePackages()` (`vendor/sources.ts:236`) include `i18n`, which feeds
`scripts/api-compare/config.ts:15` PACKAGES and `libPathsManifest()` →
`extract-ruby-api.rb`. The gem has deferrable surface that will never be
ported (see RFC): `backend/{chain,fallbacks,key_value,cache,cache_file,
cascade,gettext,interpolation_compiler,lazy_loadable,memoize,metadata,
pluralization}.rb`, `gettext/*`, `locale/*`, `middleware.rb`,
`backend/transliterator.rb`, `version.rb`, `lib/i18n/tests/*` (test-support
mixins, not library surface). Use the existing exclusion mechanisms
(`scripts/api-compare/unported-files.ts`, `SKIP_GROUPS` in
`scripts/api-compare/conventions.ts`) with reasons, as rack/globalid did in
wave 6 (#1589). Depends on the facade story.

## Acceptance criteria

- `compareApi: true` (i.e. flag removed) for i18n in `vendor/sources.ts`;
  `vendor/sources.test.ts` exclusion assertions updated to enrollment
  assertions.
- `pnpm api:compare` runs clean with an i18n section; every unported file is
  either ported or excluded with a reason — no silent gaps.
- Method/file parity number for the ported core (config, exceptions, backend
  base+simple, facade, interpolate, utils) reported and recorded in the PR.
