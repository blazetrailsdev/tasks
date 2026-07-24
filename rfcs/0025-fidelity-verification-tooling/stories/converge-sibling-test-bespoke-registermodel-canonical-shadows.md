---
title: "Converge bespoke registerModel canonical shadows in autosave/finder/base/habtm sibling tests"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `reflection-test-bespoke-registermodel-canonical-name-collisions`
(PR #5216), which added a guard in `registerModel`
(`packages/activerecord/src/associations.ts` — `guardCanonicalNameShadow`) that
throws when a bespoke class is registered under a name a canonical model owns.

The guard **only arms once `canonical-model-index.js` is imported** (it reads
`canonicalModelAutoloadIndex`). Several suites carry the SAME bespoke-shadow
anti-pattern but never import the index, so the guard is dormant there and the
shadows persist as latent traps (a wrong-value failure the moment any of them
starts resolving the canonical model). Found via a static scan
(`class <Name> extends Base` + `registerModel("<Name>"`) intersected with the
canonical class-name set:

- `packages/activerecord/src/autosave-association.test.ts` — Account, Author,
  Bird, Book, Category, Client, Comment, Company, Customer, Eye, Firm, Iris,
  Order, Owner, Parrot, Person, Pirate, Post, Reference, Ship, User (many
  sites; note `AuthorM`/`BookM` dynamic-import aliasing at :4167).
- `packages/activerecord/src/finder.test.ts` — Post, Topic.
- `packages/activerecord/src/base.test.ts` — Bulb, Car.
- `packages/activerecord/src/habtm-destroy-order.test.ts` — Lesson, Student.
- `packages/activerecord/src/associations/has-many-associations.test.ts` — CpkAuthor.

## Acceptance criteria

- Converge each colliding bespoke registration onto the canonical model,
  reading the corresponding Rails test first (do NOT rename tests); de-collide
  to a non-canonical name only where no canonical model fits.
- After conversion, the file should import `canonical-model-index.js` so the
  guard is armed and green.
- Split across multiple PRs if needed (500 LOC ceiling) — autosave-association
  alone is large and likely its own PR (or several).
- Existing tests stay green.
