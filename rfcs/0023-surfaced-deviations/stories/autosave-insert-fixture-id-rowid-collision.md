---
title: "Autosave INSERT collides with CRC32 fixture id (sqlite rowid seq not advanced)"
status: done
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 5
pr: 3490
claim: "2026-06-16T18:56:57Z"
assignee: "autosave-insert-fixture-id-rowid-collision"
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

- [x] After loading fixtures, an autosaved/created new record of the same model
      inserts without an id collision. Root cause was not the sequence (a plain
      `create` after fixtures correctly draws `MAX(id)+1`); it was
      `SingularAssociation#scopeForCreate` surfacing the target PK. Fixed by
      mirroring Rails `super.except!(*Array(klass.primary_key))`.
- [x] Un-skipped the 2 affected `inverse-associations.test.ts` tests that hit the
      collision ("child instance should be shared with newly created parent",
      "that we can create associations that have the same reciprocal name from
      different models"). The 3rd listed test ("building has many parent
      association inverses one record") clears the collision but fails on a
      separate has_many-inversing build gap — tracked as
      build-human-inverses-has-many.
