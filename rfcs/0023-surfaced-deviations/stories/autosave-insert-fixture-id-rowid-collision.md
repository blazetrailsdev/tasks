---
title: "Autosave INSERT collides with CRC32 fixture id (sqlite rowid seq not advanced)"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced during the inverse-associations canonical port (PR #3471). When a test
loads fixtures (which insert rows with CRC32-hashed ids via `FixtureSet.identify`)
and then **autosaves a freshly-built record** of the same model (e.g.
`face.create_human(...)`, `interest.build_human + save!`, `human.interests.build +
save!`), the autosave INSERT raises `UNIQUE constraint failed: <table>.id`.

Root cause: the sqlite rowid/autoincrement sequence is not advanced past the
loaded fixture ids, so the autosaved INSERT picks an id that collides with a
hashed fixture id. Rails avoids this because its fixture ids are large hashes and
the sequence is reset; our loader inserts the hashed ids but does not bump the
sequence.

Reproduces in `inverse-associations.test.ts` (3 tests skipped for this):
`InverseBelongsToTests` "child instance should be shared with newly created
parent", "building has many parent association inverses one record";
`InverseMultipleHasManyInversesForSameModel` "that we can create associations
that have the same reciprocal name from different models".

- fixture id source: `packages/activerecord/src/test-helpers/define-fixtures.ts`
  (`fixtureId` / CRC32).

## Acceptance criteria

- [ ] After loading fixtures, an autosaved/created new record of the same model
      inserts without an id collision (sequence advanced past fixture ids, or
      equivalent), on sqlite (and pg/mysql).
- [ ] Un-skip the 3 affected `inverse-associations.test.ts` tests (and any others
      hitting the same collision) as part of, or following, the fix.
