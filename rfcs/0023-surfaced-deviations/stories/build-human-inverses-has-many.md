---
title: "build-human-inverses-has-many"
status: claimed
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-19T11:12:25Z"
assignee: "build-human-inverses-has-many"
blocked-by: null
---

## Context

Surfaced while fixing `autosave-insert-fixture-id-rowid-collision` (RFC 0023).
That fix (SingularAssociation#scopeForCreate strips the klass PK, mirroring
Rails `singular_association.rb:43`) cleared the `UNIQUE constraint failed:
humans.id` collision, letting `InverseBelongsToTests` "building has many parent
association inverses one record" run past the INSERT. It now fails on a separate
gap.

Test (mirrors Rails `test_building_has_many_parent_association_inverses_one_record`,
`activerecord/test/cases/associations/inverse_associations_test.rb`):

```ts
await withHasManyInversing(Interest, async () => {
  const interest = new Interest();
  (interest as any).buildHuman();
  expect(await association((interest as any).human, "interests").size()).toBe(1);
  await (interest as any).saveBang();
  expect(await association((interest as any).human, "interests").size()).toBe(1);
});
```

Under `has_many_inversing`, `interest.buildHuman()` (belongs_to build) does not
wire the inverse `human.interests` has_many to include `interest`, so
`human.interests.size` is 0 (expected 1). This is the
`set_inverse_instance` / has_many-inversing build path, not the fixture-id
collision (already fixed).

- Test currently `it.skip` at
  `packages/activerecord/src/associations/inverse-associations.test.ts` in
  `InverseBelongsToTests`, with a comment pointing here.

## Acceptance criteria

- [ ] Under `has_many_inversing`, building a belongs_to target via
      `buildHuman()` inverses the new parent's has_many collection so it
      contains the owner record (both before and after `save!`).
- [ ] Un-skip `InverseBelongsToTests` "building has many parent association
      inverses one record" in `inverse-associations.test.ts`.
