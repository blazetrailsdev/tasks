---
title: "Canonical topics omits Rails author_name/title index"
status: in-progress
updated: 2026-07-03
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 4454
claim: "2026-07-02T23:57:51Z"
assignee: "canonical-topics-missing-author-name-title-index"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 Phase 3 (PR 4450) converted bespoke `defineSchema` calls to
`create_table` in the MySQL/abstract adapter tests. While mirroring
`schema.rb`'s `create_table :topics` a canonical-schema fidelity gap surfaced:
the canonical schema omits an index that Rails declares.

- Rails: `vendor/rails/activerecord/test/schema/schema.rb` `create_table :topics`
  ends with `t.index [:author_name, :title]`.
- trails: `packages/activerecord/src/test-helpers/canonical-schema.ts`
  `define("topics", …)` has no index, and
  `packages/activerecord/src/test-helpers/test-schema.ts` `TEST_SCHEMA.topics`
  likewise omits it.

The boot-laid canonical `topics` therefore lacks the `[author_name, title]`
index. This is a pre-existing canonical-schema fidelity gap (not introduced by
PR 4450) — the inline `create_table` in `schema.test.ts` deliberately matches
the canonical shape (no index) so the two stay consistent, and the affected
test only asserts `primaryKey("topics")`, so nothing breaks today.

## Acceptance criteria

- Add `t.index(["author_name", "title"])` to `topics` in
  `canonical-schema.ts` and the equivalent index entry in `TEST_SCHEMA.topics`
  (`test-schema.ts`) so the two paths stay byte-for-byte identical (the
  `canonical-schema.test.ts` parity gate must still pass).
- Verify no test that reflects on `topics` indexes (schema-dumper, index
  introspection) regresses; update expectations if any faithfully-canonical
  test now sees the new index.
- Faithful to `schema.rb` — index name follows Rails' default derivation.
