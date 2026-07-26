---
title: "Extractor + api:extra support for @noRailsEquivalent"
status: in-progress
updated: 2026-07-26
rfc: "0080-api-compare-jsdoc-metadata"
cluster: api-compare
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: 5358
claim: "2026-07-26T16:22:55Z"
assignee: "no-rails-equivalent-tag-extractor-support"
blocked-by: null
closed-reason: null
---

# Extractor + api:extra support for the `@noRailsEquivalent` tag

## Context

Foundation story for this RFC's extra-surface half. The tag grammar and
semantics are settled in the RFC README (`@noRailsEquivalent <reason>`,
sibling of PR #5229's `@missingRailsCall`; distinct from `@internal`, which
removes a method from the surface — this tag keeps it counted but justified).

- `scripts/api-compare/extract-ts-api.ts` — `hasInternalJsDocTag`
  (extract-ts-api.ts:1228 on main, added by the
  `extra-surface-honor-internal-jsdoc-on-file-functions` branch) is the
  precedent for JSDoc tag reading via `ts.getJSDocTags`. Members and
  `fileFunctions` are emitted around extract-ts-api.ts:471-486.
- `scripts/api-compare/extra-surface.ts` — allowlist matching at
  extra-surface.ts:780-793 (`allowKeys.has(allowKeyOf(...))` →
  `allowlistedCount`), stale-entry gate at extra-surface.ts:997-1077,
  reason validation in `findInvalidAllowEntries` (extra-surface.ts:255).
- Reason grammar mirrors PR #5229's `parseJsdoc` (continuation lines attach
  to the tag; prose preserved verbatim).

## Acceptance criteria

- `extract-ts-api.ts` records `noRailsEquivalent: "<reason prose>"` on
  `MethodInfo` for class members, module members, and top-level exported
  functions carrying the tag; continuation lines are joined into the reason.
- A tag with an empty reason is a hard error (mirrors the allowlist's
  empty-reason rejection).
- `extra-surface.ts` counts tagged extras as `allowlisted` (same `Allowed`
  column and JSON report shape as JSON-allowed entries — the stats-DB
  consumer must see an unchanged schema), while still honoring
  `extra-surface-allow.json` during the migration window.
- Stale-tag gate: a `@noRailsEquivalent` tag on a method that does not flag
  as extra surface fails the run with a file/name listing, exactly like
  stale JSON entries do today.
- Unit tests in `extract-ts-api.test.ts` and `extra-surface.test.ts` cover:
  tagged member, tagged file function, continuation-line reason, empty
  reason error, stale tag failure, JSON+tag coexistence.
