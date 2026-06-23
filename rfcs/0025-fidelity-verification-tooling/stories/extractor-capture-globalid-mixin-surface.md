---
title: "api-compare: resolve cross-package GlobalID mixin into AR Base allowed-set"
status: in-progress
updated: 2026-06-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3992
claim: "2026-06-23T13:17:40Z"
assignee: "extractor-capture-globalid-mixin-surface"
blocked-by: null
---

## Context

Follow-up to `extractor-capture-metaprogrammed-ruby-surface` (RFC 0025). That
PR (#3913) resolved the class_attribute/alias/delegate false-novels, but
`pnpm api:extra --package activerecord --novel-only` still shows GlobalID
mixin methods as novel in `base.ts`: `findGlobalId`, `findSignedGlobalId`,
`findSignedGlobalIdBang` (and instance `to_gid`/`to_sgid` variants).

These come from `GlobalID::Identification` (vendored `globalid` gem,
`vendor/globalid/lib/global_id/`), which `ActiveRecord::Base` includes via
`include GlobalID::Identification`. `extra-surface.ts`'s `collectAllowedNames`
resolves `include`s via `resolveModuleName`, which is package-scoped — it
"silently skips" cross-package / stdlib mixins (see the docstring at
`scripts/api-compare/extra-surface.ts`). So the globalid module's methods never
enter base.ts's allowed set, and their faithful TS ports look novel.

## Acceptance criteria

- `extra-surface.ts` (or compare's shared mixin resolution) resolves
  cross-package `include`s against the other packages' extracted manifests, so
  `GlobalID::Identification` instance methods land in the allowed set of
  AR `Base`.
- `pnpm api:extra --package activerecord --novel-only` no longer reports
  `findGlobalId`/`findSignedGlobalId`/`findSignedGlobalIdBang` (and the
  `to_gid`/`to_sgid` family) as novel.
- `pnpm api:compare` gate + the api-compare test suites still pass.
