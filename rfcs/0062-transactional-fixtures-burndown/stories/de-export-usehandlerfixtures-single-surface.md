---
title: "De-export useHandlerFixtures so fixtures() is the sole public surface"
status: claimed
updated: 2026-07-05
rfc: "0062-transactional-fixtures-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 2
pr: null
claim: "2026-07-05T02:52:29Z"
assignee: "de-export-usehandlerfixtures-single-surface"
blocked-by: null
closed-reason: null
---

## Context

RFC 0062 (transactional-fixtures burndown). Small standalone cleanup, no deps —
independent of the setupFixtures conversion campaign.

`remove-usefixtures-public-surface` (#4584, done) migrated the 6 direct
`useFixtures` callers onto `fixtures()`, but left `useHandlerFixtures` still
EXPORTED (`test-helpers/use-fixtures.ts:633-645`). Verified on origin/main
2026-07-05: NO ported AR test calls `useFixtures` or `useHandlerFixtures`
directly — the only `.test.ts` caller is `test-helpers/use-fixtures.test.ts`
(the engine self-test). Its own docstring says "tests should prefer `fixtures()`".

So `fixtures()` (`test-helpers/fixtures.ts`) is already the de-facto sole surface;
this just makes it official.

## Acceptance criteria

- `useHandlerFixtures` is no longer exported for use outside `test-helpers/`
  (make it a non-exported internal that `fixtures()` composes, or fold it into
  `fixtures.ts`). Repoint `use-fixtures.test.ts` through `fixtures()` without
  renaming Rails-matched test names.
- `git grep -l "useHandlerFixtures" packages/activerecord/src/**/*.test.ts`
  -> only `test-helpers/` (if any); not exported from any public/test-helper index.
- `test:compare` delta >= 0; no test renames.
