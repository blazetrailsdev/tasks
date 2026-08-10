---
title: "preloadTranslationFiles' @noRailsEquivalent block is detached from its declaration"
status: done
updated: 2026-08-04
rfc: "0074-i18n-parity"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 6059
claim: "2026-08-04T13:42:32Z"
assignee: "i18n-preload-norailsequivalent-tag-detached"
blocked-by: null
closed-reason: null
---

## Context

`packages/i18n/src/backend/base.ts` reports `preloadTranslationFiles` as novel
extra surface in `pnpm parity:api:extra --package i18n`, even though it carries a
`@noRailsEquivalent PERMANENT` block. The block is detached: a second JSDoc
comment (for `registerLocaleModule`) sits between the tagged block and the
`export async function preloadTranslationFiles`, so the tag attaches to the
wrong declaration and the reason is lost.

## Acceptance criteria

- The `@noRailsEquivalent` reason for `preloadTranslationFiles` sits on that
  declaration (move `registerLocaleModule` and its JSDoc out from between them).
- `pnpm parity:api:extra --package i18n` shows `backend/base.ts` with 0 novel names,
  and the reason surfaces under Allowed.
