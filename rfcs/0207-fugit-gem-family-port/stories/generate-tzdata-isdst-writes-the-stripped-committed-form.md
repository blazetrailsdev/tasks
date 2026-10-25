---
title: "generate-tzdata-isdst writes the stripped committed table"
status: in-progress
updated: 2026-10-25
rfc: "0207-fugit-gem-family-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9306
claim: "2026-10-25T15:13:48Z"
assignee: "generate-tzdata-isdst-writes-the-stripped-committed-form"
blocked-by: null
closed-reason: null
---

## Context

`scripts/generate-tzdata-isdst.test.ts` "reproduces the committed tzdata-isdst.ts table" fails on main. The committed `packages/date/src/tzdata-isdst.ts` had its JSDoc stripped by `blazetrails/no-freeform-comments`, but `scripts/generate-tzdata-isdst.ts` still writes the full `HEADER` and reader comments. The test skips where ruby/tzinfo is absent, so CI stays green while the regeneration guard is broken. trails#9303's `generate-tzdata-abbreviations.ts` already writes the stripped form.

## Acceptance criteria

- [ ] `generate-tzdata-isdst.ts` writes exactly the committed file: `HEADER` is empty and `READER` keeps only the `@noRailsEquivalent PERMANENT` tag.
- [ ] `pnpm vitest run scripts/generate-tzdata-isdst.test.ts` passes locally with ruby + tzinfo present.
