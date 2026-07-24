---
title: "converge-autosave-association-bespoke-registermodel-canonical-shadows"
status: in-progress
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5248
claim: "2026-07-24T17:50:54Z"
assignee: "converge-autosave-association-bespoke-registermodel-canonical-shadows"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `converge-sibling-test-bespoke-registermodel-canonical-shadows`,
which converged the small sibling suites (`finder.test.ts`, `base.test.ts`,
`habtm-destroy-order.test.ts`,
`associations/has-many-associations.test.ts`) onto canonical models and armed
the `registerModel` canonical-shadow guard
(`packages/activerecord/src/associations.ts` — `guardCanonicalNameShadow`) in
each by importing `test-helpers/canonical-model-index.js`.

`packages/activerecord/src/autosave-association.test.ts` was deliberately
left out: it is ~5,500 lines with ~204 `registerModel` call sites, far past the
500 LOC PR ceiling for a single pass. Its bespoke registrations shadow these
canonical class names (from `registerModel("<Name>", …)` string sites):
Account, Author, Bird, Book, Category, Client, Comment, Company, Customer, Eye,
Firm, Iris, Order, Owner, Parrot, Person, Pirate, Post, Project, Profile,
Reference, Ship, User, Widget. Note the `AuthorM`/`BookM` dynamic-import
aliasing around :4167.

Rails source: `vendor/rails/activerecord/test/cases/autosave_association_test.rb`
plus `test/models/{ship,pirate,parrot,bird,eye,iris,treasure,…}.rb`.

## Acceptance criteria

- Converge each colliding bespoke registration in
  `autosave-association.test.ts` onto the canonical model, reading the
  corresponding Rails test first (do NOT rename tests); de-collide to a
  non-canonical name only where no canonical model fits.
- Once every collision in the file is gone, the file imports
  `./test-helpers/canonical-model-index.js` so the guard is armed and green.
- Existing tests stay green.
- Split across multiple PRs (500 LOC ceiling); each PR from `main`, no stacking.
  If more than one pass is needed, register the remainder as follow-up stories
  rather than fanning out sibling PRs.
