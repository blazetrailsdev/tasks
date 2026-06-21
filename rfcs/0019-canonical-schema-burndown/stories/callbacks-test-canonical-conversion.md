---
title: "callbacks-test-canonical-conversion"
status: done
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3758
claim: "2026-06-21T00:31:25Z"
assignee: "callbacks-test-canonical-conversion"
blocked-by: null
---

## Context

`packages/activerecord/src/associations/callbacks.test.ts` (740 lines) remains
grandfathered in `eslint/require-canonical-schema-exclude.json`. The
`hm-collection-proxy-delete-transaction-rollback-test` PR converted the sibling
`collection-proxy.test.ts` to canonical but deliberately left `callbacks.test.ts`
untouched: a full canonical conversion of it is all-or-nothing and on its own
exceeds the 500 LOC PR ceiling, so it could not be bundled.

The file is dense with bespoke models:

- A `makePostWithCallbacks(...)` factory building bespoke `Post`/`Comment`
  classes for the `AssociationCallbacks` has_many add/remove callback tests
  (callbacks.test.ts:~30-609).
- Bespoke `Comment`/`Post`/`Profile`/`User` classes in earlier describes.
- The trailing `AssociationCallbacksTest` describe is ALREADY canonical
  (`useHandlerFixtures` + `Project`/`Developer`), so only the upper portion needs
  conversion.

Canonical targets: `Post`/`Comment` (has_many), and an owner subclass on a
canonical table carrying the before/after add+remove callbacks (mirror the
`ProjectWithCallback` inline-subclass pattern already in this file, and the
`AuthorWithRaisingAfterRemove` pattern added to `collection-proxy.test.ts`).

## Acceptance criteria

- [ ] Convert the bespoke-model portions of `callbacks.test.ts` to canonical
      schema + models (canonical `TEST_SCHEMA`/`useHandlerFixtures`, no bespoke
      tables, no `defineSchema` of non-canonical shapes).
- [ ] Drop the `callbacks.test.ts` entry from
      `eslint/require-canonical-schema-exclude.json`.
- [ ] Test names preserved verbatim (test:compare matches by name).
- [ ] If the conversion exceeds 500 LOC, split into sub-stories by describe block
      rather than fanning out PRs from one agent.
