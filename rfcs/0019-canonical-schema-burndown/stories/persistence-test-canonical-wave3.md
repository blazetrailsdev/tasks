---
title: "persistence-test-canonical-wave3"
status: claimed
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-06-21T14:22:43Z"
assignee: "persistence-test-canonical-wave3"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave2`. That story converted the
three canonical `items: { name }` `describe("PersistenceTest")` blocks in
`packages/activerecord/src/persistence.test.ts` onto
`useHandlerFixtures(["items"], { schema: canonicalSchema })` + the canonical
`Item` model (tests: `destroyBy destroys matching records with callbacks`,
`deleteBy deletes matching records without callbacks`, `finds and updates a
record by id`, `destroys all records`). It also added the shared imports
(`registerModel`, `useHandlerFixtures`, `TEST_SCHEMA as canonicalSchema`,
`Item`) and the `registerModel(Item)` call at module top.

~25 `describe("PersistenceTest")` blocks in the same file still use bespoke
`defineSchema({...})` + inline `class Foo extends Base` declarations. They
target the rest of `vendor/rails/activerecord/test/cases/persistence_test.rb`.

Key constraints discovered (carry forward):

- Canonical schema (`test-helpers/test-schema.ts`) tables/columns available:
  `topics` (rich: title/content/approved/replies_count/...), `posts`
  (title NOT NULL, body text NOT NULL, author_id, type, \*\_count) -- note body
  is NOT NULL so bespoke `Post.create({title})` needs a body; `items` (name
  only); `users` (token/auth_token/password_digest/created_at/updated_at -- NO
  name/email/age/status); `minimalistics`, `clothing_items`. Blocks using
  bespoke tables/columns not in canonical (`counters`, `cm_items`, `cb_posts`,
  `special_posts`, `count_posts`, `default_records`, `animals`, `dogs`,
  `requireds`, `trackeds`, `validateds`, `json_topics`, `features`,
  `order_items`, `other_topics`, `users.{name,email,age,status}`,
  `posts.{views,status,created_at,updated_at}`, `items.status`) must either
  ride the real Rails table (add the column to canonical TEST_SCHEMA mirroring
  Rails schema.rb if genuinely missing) or stay bespoke for a later wave --
  fidelity over expedience (RFC 0019).
- Fixtures are LOADED, so absolute-count assertions break. The `items` table
  ships a `dvd` fixture row. Rewrite count assertions fixture-aware (e.g.
  `Item.where({name}).count()` or count-relative) while keeping the test NAME
  verbatim -- wave1/wave2 did this.
- The `blazetrails/test-fixture-parity` rule only fires for test names present
  in `eslint/test-fixture-parity.json` (a real Rails fixture-counterpart). The
  invented trails names here are not mapped, so `useHandlerFixtures` may be
  called WITHOUT destructuring an accessor (avoids no-unused-vars). When a test
  DOES map to a fixture-using Rails test, it must call a named accessor.
- Keep importing canonical `Topic` UNDER ALIAS (`Topic as CanonicalTopic`,
  rebind to local `const Topic` per converted block) until ALL blocks convert
  -- a top-level `Topic` makes esbuild rename bespoke in-function `class Topic`
  in still-bespoke blocks to `Topic2` -> resolves to non-existent `topic2s`.
  (Bespoke `Item` blocks set `static _tableName = "items"` explicitly so they
  are unaffected by the top-level `Item` import added in wave2.)

## Acceptance criteria

- [ ] Convert remaining `describe("PersistenceTest")` blocks in
      `persistence.test.ts` off `defineSchema` onto canonical schema + handler
      fixtures, matched to Rails bodies. Test names unchanged.
- [ ] Ship per-`describe` across sibling PRs off `main` (NOT stacked); each
      PR <=500 LOC. Register further waves as new stories if more than one PR
      remains.
- [ ] Remove `persistence.test.ts` from
      `eslint/require-canonical-schema-exclude.json` once FULLY converted (no
      `defineSchema`, no `eslint-disable`).
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean.
