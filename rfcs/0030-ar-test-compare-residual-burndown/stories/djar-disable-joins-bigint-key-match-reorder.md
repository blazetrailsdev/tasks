---
title: "Converge DisableJoinsAssociationRelation reorder + inverse find() key-match for BigInt PK vs number FK"
status: claimed
updated: 2026-06-24
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-06-24T20:18:18Z"
assignee: "djar-disable-joins-bigint-key-match-reorder"
blocked-by: null
---

## Context

Surfaced while shipping the assertion-churn sweep PR 4034
(story `pg-bigserial-assertion-sweep-hasmany-hasone`, blocker for the bigserial
flip PR 3966). Under the flip (`schema-creation.ts` `primary_key` becomes
`BIGSERIAL PRIMARY KEY`), default-PK columns deserialize int8 to a JS `BigInt`
while FK columns stay `number`. The disable-joins / inverse paths then compare a
`BigInt` PK to a `number` FK and miss, returning empty/undefined targets (not an
`expected N to be Nn` display mismatch), so no test-literal coercion can fix
them; they were deliberately left out of PR 4034.

Root cause is in the DisableJoinsAssociationRelation reorder key:
`disable-joins-association-relation.ts` `mapKey` serializes a bigint distinctly
from a number, so `1n` and `1` map to different Map keys and the loaded-chain
reorder drops every row. The `inverse-associations.test.ts` 692/701 sites are
the inverse-of `find()` path not wiring the owner under a BigInt PK.

The sibling impl story `pg-bigint-assoc-key-match-through-inverse-impl` claims
"disable-joins paths" in its Context, but its file list does NOT enumerate these
files; this story covers the specific DJAR `mapKey` normalization plus the
residual test sites so nothing falls through the gap.

Reproduced locally on PG with the flip applied:

- `disable-joins-association-scope.test.ts`: 205, 232 (`expected [] to deeply equal [...]`)
- `disable-joins-composite-key.test.ts`: 279
- `disable-joins-nested-through.test.ts`: 206
- `inverse-associations.test.ts`: 692, 701 (`.toBe(human)` identity miss)

## Acceptance criteria

- [ ] DJAR reorder `mapKey` treats BigInt and number join keys as equal
      (normalize both, e.g. canonical string) so the disable-joins reorder
      matches rows under the bigserial flip.
- [ ] Inverse-of `find()` path wires the owner when PK is BigInt and FK is number.
- [ ] The listed sites green on PG WITH the flip applied locally; green on
      sqlite/mysql. Test names verbatim. Fix the matching code, not the schema
      (FK columns stay integer per Rails). Do NOT touch the deserializer.
