---
title: "d2-has-one-remaining-gaps"
status: in-progress
updated: 2026-07-09
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4827
claim: "2026-07-09T11:49:38Z"
assignee: "d2-has-one-remaining-gaps"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `d2-has-one-fixture-bodies`. That story filled every has_one test
body that the current trails feature set supports
(`packages/activerecord/src/associations/has-one-associations.test.ts`).

The remaining `it.skip` entries in that file are gated on genuine feature gaps,
grouped here so each cluster can be picked up independently:

- **touch-option family** (~9): `has one with touch option on
create/update/touch/destroy/empty update/nonpersisted built` + polymorphic
  touch variants — needs `touch:` support on has_one and Club/Membership +
  SpecialCar/SpecialBulb models.
- **replacement / creation-failure semantics** (~5): `creation failure replaces
existing …`, `replacement failure due to …`, `creation failure due to new
record should raise error` — post-failure has_one target reset + becomes()
  dependent replacement.
- **polymorphic / cpk shapes** (~5): `nullify on polymorphic association`,
  `nullification on cpk association`, `with polymorphic has one with custom
columns name`, `composite primary key malformed association (owner) class`.
- **enum-through-association** (2): `association enum works properly` (+ nested
  join) — SpecialBook enum + has_one join.
- **misc singles**: `nullification on destroyed association` (AuditLog model
  not ported), `restrict with error with locale` (I18n backend),
  `reload association with query cache` (connection query cache),
  `assignment before child saved` / `has one loading for new record` /
  `has one autosave with primary key manually set`,
  `clearing an association clears the associations inverse`
  (belongs_to update nullify), `create with inexistent foreign key failing`
  (UnknownAttributeError on bad FK).

Each skipped test carries an inline note referencing this story.

## Acceptance criteria

- [ ] Feature clusters above are implemented (or split into their own stories)
      and the corresponding has_one tests un-skipped with verbatim Rails names.
- [ ] `test:compare` delta non-negative for has_one_associations_test.rb.
