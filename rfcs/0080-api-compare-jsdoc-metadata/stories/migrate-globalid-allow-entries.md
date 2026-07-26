---
title: "Migrate globalid extra-surface allow entries to inline tags"
status: ready
updated: 2026-07-26
rfc: "0080-api-compare-jsdoc-metadata"
cluster: api-compare
deps: ["no-rails-equivalent-tag-extractor-support"]
deps-rfc: []
est-loc: 150
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Migrate globalid extra-surface allow entries to inline tags

## Context

11 `extra-surface-allow.json` entries, package `globalid`:

- `uri/gid.ts` — `constructor` (URI::GID inherits its initializer from
  URI::Generic; TS has no URI base class).
- `signed-global-id.ts` — `[Symbol.toPrimitive]`, `create`, `modelClass`,
  `modelId`, `modelName`, `params`, `uri` (TS peer-class re-declarations of
  members Ruby inherits from GlobalID; see each entry's reason, including
  the pointer to the `globalid-sgid-inherits-globalid` story — if that
  story lands first, some entries may simply disappear instead of being
  tagged).
- `locator.ts` — `setModelFinder`, `lookupClass` (constantize stand-ins),
  `find`, `where` (duck-typed `LocatorModel` interface members).

Declarations in `packages/globalid/src/`. Depends on the extractor-support
story.

## Acceptance criteria

- Each still-flagging method carries `@noRailsEquivalent` with its
  allow.json reason preserved.
- The 11 globalid entries are deleted from `extra-surface-allow.json`.
- `pnpm api:compare && pnpm api:extra` passes with identical totals for
  globalid (no stale entries, no new extras).
- Diff within the 500-LOC ceiling.
