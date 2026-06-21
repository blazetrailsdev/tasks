---
title: "persistence-port-residual-cluster"
status: ready
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `persistence-port-destubbed-rails-tests` (RFC 0019). That story
restored the canonical CPK-destroy, becomes/STI, and readonly clusters of
`persistence_test.rb` names deleted as zero-assertion stubs in PR #3817. The
remaining names from those clusters were deferred here because each needs
impl/schema work or carries shared-table-DDL flake risk beyond the porting
story's scope:

- `test_becomes_includes_changed_attributes`
  (`vendor/rails/activerecord/test/cases/persistence_test.rb:473`) — blocked on
  a fidelity gap: trails treats `name` as a restricted attribute method, so
  `new Company(name:)` neither dirty-tracks the assignment
  (`changedAttributeNamesToSave` returns `[]`, should be `["name"]`) nor exposes
  a `.name` reader. The `becomes` change set sharing landed in the parent PR
  (`packages/activerecord/src/persistence.ts`) and works for non-restricted
  attributes (verified with `metadata`); only the restricted-`name` path is
  outstanding.
- `test_becomes_default_sti_subclass` (persistence_test.rb:765) — needs
  `change_column_default :topics, :type, "Reply"` + `reset_column_information`
  on the shared `topics` table, reverted in `ensure`. DDL on a shared canonical
  table under parallel forks risks cross-file flake; needs an isolation pattern.
- `test_update_attribute_for_aborted_callback!` (persistence_test.rb:1077) —
  needs a `Class.new(Topic)` with `before_update { throw :abort }` whose
  `self.name == "Topic"` so the STI type/reload stays "Topic";
  `updateAttributeBang` must raise `RecordNotSaved` on abort. The anonymous
  subclass + registry naming is the open question.
- `test_reset_column_information_resets_children` (persistence_test.rb:1537) —
  `add_column`/`remove_column :topics, :foo` + `reset_column_information`, then
  asserts the child subclass picks up `foo`/`foo_changed?`. Same shared-table
  DDL isolation concern as above.
- `test_populates_non_primary_key_autoincremented_column`
  (persistence_test.rb:36) — `TitlePrimaryKeyTopic.create!(title:)` must
  populate the non-PK auto-increment `id`. Insert path only returns the PK
  (`title`); needs auto-populated non-PK column read-back after insert.
- `test_populates_autoincremented_id_pk_regardless_of_its_position_in_columns_list`
  (persistence_test.rb:42) — `AutoId.columns.select(&:auto_populated?)`.
  Canonical `auto_id_tests` schema lists `auto_id` first; Rails schema
  (`vendor/rails/activerecord/test/schema/schema.rb:107`, `id: false`) orders
  `value, published_at, auto_id` so the first auto-populated column is not the
  PK. Needs a canonical-schema column-order fix to match Rails.
- `test_create_model_with_uuid_pk_populates_id` /
  `test_create_model_with_custom_named_uuid_pk_populates_id`
  (persistence_test.rb:559, 568) — PostgreSQL-only (`ChatMessage` /
  `ChatMessageCustomPk`). `chat_messages` / `chat_messages_custom_pk` tables
  with uuid PKs are absent from the canonical schema; needs schema additions +
  PG uuid-PK create support.

## Acceptance criteria

- [ ] Restore each name above as a genuine canonical test in
      `packages/activerecord/src/persistence.test.ts` (Rails names verbatim,
      canonical models/fixtures, real assertions), implementing the missing
      persistence.ts / schema / adapter support each requires.
- [ ] No `expect(true).toBe(true)` stubs.
- [ ] Shared-table DDL tests use an isolation pattern that does not flake
      sibling files under parallel forks.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean.
