---
title: "call-tag-population-collides-on-shared-basename"
status: claimed
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-22T18:35:23Z"
assignee: "call-tag-population-collides-on-shared-basename"
blocked-by: null
closed-reason: null
---

## Context

`wave-5b-tail-sweep` migrated 14 of the 15 activesupport single-row `kind: "set"`
shards to `@missingRailsCall` tags. The 15th —
`scripts/api-compare/call-mismatches-exclude/activesupport/gem-version.json`
(`gem_version` → `new`) — could not migrate: minting the tag on
`packages/activesupport/src/gem-version.ts` reds `pnpm parity:api:calls` with

    call-mismatches ratchet: 1 STALE @missingRailsCall tag(s) whose call is no longer flagged.
      - actionpackversion  gem-version.ts  gemVersion  new

`compare.ts` keys the tag population (`tsMissingCallTagsByFileName`,
`scripts/api-compare/compare.ts:2602`, filled by `recordTaggedCalls` at :2722)
by the RELATIVE tsFile path alone, and that population spans the package under
comparison PLUS its deps. `actionpack` depends on `activesupport`, and both ship
a `gem-version.ts`, so activesupport's tag lands in `actionpackversion`'s map,
is never consumed there, and `staleCallTags` (:4000) reports it stale.

Every package in the repo ships a `gem-version.ts`, so this bites any
same-basename file across a dep edge, not just this one.

## Acceptance criteria

- [ ] The tag population is keyed by package as well as tsFile (or dep-package
      tags are excluded from the consuming package's stale check), so a tag on
      `activesupport/src/gem-version.ts` cannot be reported stale under
      `actionpackversion`.
- [ ] A regression test in `scripts/api-compare/` covers a tagged file whose
      basename collides with a dep's.
- [ ] `scripts/api-compare/call-mismatches-exclude/activesupport/gem-version.json`
      migrates to a `@missingRailsCall new — PERMANENT: ...` tag carrying its
      existing reviewed reason, via
      `pnpm parity:api:build --package activesupport --file gem-version.ts --call new`,
      and the emptied shard is deleted.
- [ ] `pnpm parity:api:calls`, `parity:api:calls:args`, `parity:api:reasons`,
      `parity:api:detached` green.
