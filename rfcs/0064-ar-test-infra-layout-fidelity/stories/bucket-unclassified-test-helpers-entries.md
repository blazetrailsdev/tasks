---
title: "Bucket the test-helpers/ entries RFC 0064's disposition table misses"
status: ready
updated: 2026-07-27
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0064's README dispositions every `packages/activerecord/src/test-helpers/`
entry into buckets A-D, and carries a staleness warning telling whichever story
executes first to re-scan `test-helpers/` against current `main` and bucket
anything new. `move-test-helpers-to-support-dir` (PR #5361) was that story. The
re-scan turned up entries the table does not cover, and they were left in
`test-helpers/` as the conservative call without any disposition being recorded:

- `pooled-test-adapter.test.ts` — not in any bucket. Its subject is
  `src/test-adapter.ts` (not a `test-helpers/` module at all), so it is
  arguably misfiled where it sits.
- `naked-fixtures.test.ts` — not in any bucket. Exercises the bucket-D fixtures
  machinery (`define-fixtures.ts`, `fixtures.ts`), so it probably rides along
  with whatever `disposition-remaining-test-helpers` decides for bucket D, but
  that is not written down anywhere.
- `fixture-connection.ts` + `fixture-connection.test.ts` — landed on `main`
  _during_ PR #5361 (it caused the rebase conflict in
  `use-transactional-tests.ts`). Exactly the drift the staleness warning
  predicts, and it postdates the snapshot, so it has no bucket.

For contrast, `rocket-tables.ts` _is_ covered (bucket D, README:101-104) and was
correctly left in place — the gap is specifically the four entries above.

Second, smaller item: sibling story bodies in this RFC point at
`docs/infrastructure/ar-test-setup-cases-helper-layout-audit.md` for the "Every
current `test-helpers/` entry has a destination" A-D disposition. That file has
never merged to `main` — it exists only in unmerged commit `0b49304a9`, and even
that revision has no such section. The real disposition table is this RFC's
README. The dangling pointer cost real time on #5361 and will cost it again.

## Acceptance criteria

- Re-scan `packages/activerecord/src/test-helpers/` against current `main` and
  assign a bucket to every entry with none — at minimum
  `pooled-test-adapter.test.ts`, `naked-fixtures.test.ts`,
  `fixture-connection.ts`, `fixture-connection.test.ts` — recording each
  decision in the RFC README's disposition table with its Rails justification
  (`pnpm rails:find`, `vendor/rails/activerecord/test/`).
- Move any entry whose bucket says it should move; leaving one in place is a
  valid outcome but must be written down, not implicit.
- Correct the dangling
  `docs/infrastructure/ar-test-setup-cases-helper-layout-audit.md` cross-reference
  in this RFC's story bodies to point at the README (or land the audit doc, if
  it is still wanted).
- Re-date the README snapshot and keep the staleness warning.
- No behavior change: `pnpm typecheck` and `pnpm lint` clean; any moved file's
  importers updated.
