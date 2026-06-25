---
title: "persistence-test-canonical-wave14"
status: done
updated: 2026-06-25
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: 4124
claim: "2026-06-25T14:21:15Z"
assignee: "persistence-test-canonical-wave14"
blocked-by: null
---

> **Scope override (RFC 0019 prioritization, 2026-06-25):** This story is exempt from the 500-LOC PR ceiling. Ship the full file conversion as **one PR per file**, even if additions+deletions exceed 500 LOC. Do **not** split into sibling PRs or defer part of the file to a follow-up story — the goal is to drop the file from the canonical-schema exclude list in a single PR.

## Context

Continuation of `persistence-test-canonical-wave13` (PR converted the
delete / destroy-raises-RNF / increment-decrement-with-touch /
update-attribute-with-one-updated! / build-through-factory-with-block slice of
the `@~735` bespoke posts `defineSchema` block in
`packages/activerecord/src/persistence.test.ts` to canonical `Topic` +
`topics` fixtures, and deleted pure-deviation stubs: `update parameters`,
`instantiate creates a new instance`, `persist inherited class with different
table name`, `reload via querycache`, `model with no auto populated fields
still returns primary key after insert`, `create with custom timestamps`).

Remaining bespoke `defineSchema(...)` describe blocks in
`persistence.test.ts` (re-locate with `grep -n 'defineSchema(' persistence.test.ts`):

- posts block (still has bespoke `class PostClass` on `posts`/`cb_posts`/
  `timed_posts`): `delete new record`, `destroy new record`, `destroy record
with associations`, `delete record with associations` (these four need
  canonical `Client`/`Firm` — but `name` is a restricted attribute so
  `client.name = ...` may not route through `writeAttribute`; verify the
  frozen-mutation RuntimeError path before converting), `update column with
model having primary key other than id` (→ `Minivan.find("m1")`, but reading
  `minivan.name` hits the restricted-`name` getter — verify first), `update
column should not modify updated at` (→ `Developer.find(1)` + prev_month),
  `update sti type` (→ `topics(:second).becomesBang(Topic)`), `update attribute
in before validation respects callback chain` (Topic subclass w/ callback
  chain), `delete isnt affected by scoping` (needs `where("1=0").scoping`),
  `update columns with default scope`, `becomes errors base` (Admin::User +
  store_accessor), `duped becomes persists changes from the original` (→
  `topics(:first).dup.becomes(Reply)`).
- animals/dogs/minimals/order_items/other_topics/topics block (largest).
- bespoke `class Post` `update all` block — BLOCKED: faithful
  `test_update_all` passes a raw SQL string and `["content = ?", val]` array to
  `update_all`, but trails `Relation#updateAll` only accepts a
  `Record<string, unknown>` hash. Needs the string/array form first.
- `POSTGRESQL_SPECIFIC_SCHEMA` block — leave (canonical pg fixture schema).

Framework gaps surfaced (register separately if tackled):

- `test_update_all_with_hash` (faithful `Topic.update_all(content: ..., last_read: nil)`)
  fails: `content` is `serialize`'d on Topic, and reading back a plain
  (non-`---`-prefixed) string written by `update_all` deserializes to `null`.
  Needs serialize-coder convergence (Rails' YAML loads a bare scalar as the
  string).

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR, <=500 LOC). Real Rails
      tests -> canonical models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean; test:compare delta non-negative.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).
