---
title: "persistence-test-canonical-wave15"
status: done
updated: 2026-06-28
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 79
pr: 4216
claim: "2026-06-27T16:43:08Z"
assignee: "persistence-test-canonical-wave15"
blocked-by: null
---

## Context

Continuation of `persistence-test-canonical-wave14` (PR converted a slice of
the bespoke posts `defineSchema` block in
`packages/activerecord/src/persistence.test.ts` to canonical
`Topic`/`Minivan` + fixtures: `update parameters`, `update sti type`,
`delete isnt affected by scoping`, `update column with model having primary
key other than id`, `duped becomes persists changes from the original`; and
dropped the now-unused `cb_posts` / `timed_posts` bespoke schema entries).

Remaining bespoke `defineSchema(...)` describe blocks in `persistence.test.ts`
(re-locate with `grep -n 'defineSchema(' persistence.test.ts`):

- posts block (`@~745`, still on `posts`/`special_posts`/`ts_posts` + bespoke
  `class PostClass`). Tests still bespoke and their faithful Rails sources:
  - `delete new record` (`test_delete_new_record`), `destroy new record`
    (`test_destroy_new_record`) → canonical `Client.new({name:"37signals"})`;
    assert frozen after delete/destroy, `save` returns false, `saveBang`
    rejects `RecordNotSaved`, and a frozen-mutation raise. `name` is restricted
    so the `client.name = "something else"` raise must be ported as
    `expect(() => client.writeAttribute("name", "something else")).toThrow()`
    (writeFromUser hits AttributeSet.assertNotFrozen → FrozenError). Verify
    trails `save`-on-frozen returns false (not throws) before porting.
  - `destroy record with associations` (`test_destroy_record_with_associations`),
    `delete record with associations` (`test_delete_record_with_associations`)
    → `Client.find(3)` (companies fixture second_client, client_of=first_firm);
    assert `client.firm` is a `Firm` (verify dotted sync reader resolves on a
    frozen record), plus the same frozen/save/writeAttribute assertions.
  - `update column should not modify updated at`
    (`test_update_column_should_not_modify_updated_at`) → `Developer.find(1)`.
    Developers table has NO `updated_at` column (only `legacy_*`); the Developer
    model maps `updated_at`→`legacy_updated_at`. Verify the alias before porting;
    compares `updated_at` across `update_column(:salary, ...)` and reload
    (`to_i` second granularity).
  - `update columns with default scope`
    (`test_update_columns_with_default_scope`) → `DeveloperCalledDavid.first`
    (developers fixture `david`). BLOCKED: Rails `assert
developer.update_columns(...)` expects a truthy return, but trails
    `updateColumns` returns `Promise<void>`. Converge `updateColumns` to return
    `true` (Rails `update_columns` returns true) in the same or a prior PR.
  - `becomes errors base` (`test_becomes_errors_base`) → subclass of
    `Admin::User` (admin/user.ts) with `store_accessor :settings, :foo`;
    asserts `errors.attributeNames` and that `errors.add(:foo, ...)` does not
    raise.
  - Stubs whose faithful Rails ports need infra trails may still lack — port
    or register sub-stories: `instantiate creates a new instance`
    (`test_instantiate_creates_a_new_instance`: `Post.instantiate` + `SpecialPost`
    STI + `MissingAttributeError` on uninitialized body), `persist inherited
class with different table name` (`test_persist_inherited_class_with_different_table_name`:
    `Minimalistic` subclass on `aircraft` table + `Aircraft` fixtures),
    `reload via querycache` (`test_reload_via_querycache`: query-cache enable +
    `uncached`), `model with no auto populated fields still returns primary key
after insert` (`test_model_with_no_auto_populated_fields_still_returns_primary_key_after_insert`:
    needs a trigger-populated PK model), `create with custom timestamps`
    (`test_create_with_custom_timestamps`: `LiveParrot` + custom created/updated
    timestamps), `update attribute in before validation respects callback chain`
    (`test_update_attribute_in_before_validation_respects_callback_chain`:
    `Topic` subclass, `before_validation` calling `update_attribute`,
    `after_update if: saved_change_to_author_name?`, counter).
- animals/dogs/minimals/order_items/other_topics/topics block (`@~1069`, largest).
- bespoke `class Post` `update all` block (`@~1713`) — BLOCKED: faithful
  `test_update_all` passes a raw SQL string and `["content = ?", val]` array to
  `update_all`, but trails `Relation#updateAll` only accepts a
  `Record<string, unknown>` hash. Needs the string/array form first.
  `test_update_all_with_hash` also blocked: Topic `content` is `serialize`'d and
  reading back a bare (non-`---`) scalar written by `update_all` deserializes to
  `null` (serialize-coder convergence — Rails YAML loads a bare scalar as the
  string).
- `POSTGRESQL_SPECIFIC_SCHEMA` block (`@~1911`) — leave (canonical pg fixture).

## Acceptance criteria

- [ ] Convert/delete the next coherent slice (one PR). Real Rails tests →
      canonical models + fixtures, names verbatim; pure deviations deleted.
- [ ] No new duplicate test names.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      `pnpm lint` and `node scripts/typecheck.mjs` clean; test:compare delta
      non-negative.
- [ ] Register a further wave story if more than one PR of work remains; remove
      `persistence.test.ts` from `eslint/require-canonical-schema-exclude.json`
      only once FULLY converted (no `defineSchema`, no `eslint-disable`).
