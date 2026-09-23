---
title: "Converge trailmap's models on Rails model conventions: ApplicationRecord, inferred names, in-class callbacks, serialized JSON columns"
status: draft
updated: 2026-09-23
rfc: "0136-trailmap"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From the trailmap Rails-idiom audit. trailmap's models work, but they aren't
written the way a Rails developer would write them, and none of the gaps below
is forced by the framework. Every item is supported by trails today.

1. **Models skip `ApplicationRecord`.** `app/models/application-record.ts`
   exists and is unused. `Event` (`event.ts:9`), the four join models
   (`joins.ts:4,16,28,38`), `Meta` (`meta.ts:4`), `Rfc` (`rfc.ts:30`) and
   `Story` (`story.ts:48`) all extend `Base` directly. Rails' template is
   `class ApplicationRecord < ActiveRecord::Base; primary_abstract_class; end`
   (`railties/lib/rails/generators/rails/app/templates/app/models/application_record.rb.tt:1-3`),
   and every model inherits from it. trails has `Base.primaryAbstractClass()`
   (`packages/activerecord/src/base.ts:1081`).
2. **Private `_tableName` / `_primaryKey` statics, all redundant.** Every model
   sets `static _tableName = "..."` to the name Rails would infer. Checked with
   ActiveSupport's own inflector: `Event→events`, `Rfc→rfcs`, `Story→stories`,
   `StoryDep→story_deps`, `StoryRfcDep→story_rfc_deps`, `StoryPath→story_paths`,
   `StoryPackage→story_packages`, `Meta→meta`. `Meta` also sets
   `static _primaryKey = "key"` (`meta.ts:6`). The public seats are
   `tableName` / `primaryKey` (`base.ts:815-829`), Rails' `self.table_name=` /
   `self.primary_key=`. The key is reflected from the `meta` table anyway.
3. **Conventional `foreignKey:` options.** `belongsTo("story", { foreignKey: "story_id" })`
   and its siblings (`joins.ts`, `event.ts:22-23`, `rfc.ts:60`,
   `story.ts:105-112`) spell out the foreign key Rails derives. That includes
   `belongsTo("dependsOn", { className: "Story", foreignKey: "depends_on_id" })`,
   where `depends_on_id` is the default. Keep `className` where the name
   doesn't infer it.
4. **Casts in validations.** `this.validate(async (record) => { const rfc = record as unknown as Rfc; ... })`
   (`rfc.ts:73-81`, `story.ts:135-143`). `validate` is generic
   (`packages/activemodel/src/model.ts:62-64`), and Rails writes
   `validate :closed_rfc_stories, on: :ingest` against a private method.
5. **The auto-close callback is registered from the barrel.**
   `registerRfcAutoClose()` (`rfc-close.ts:92-99`), called from
   `app/models/index.ts:22`, adds `Story.afterSave(...)` from outside the class.
   Its comment cites an import cycle, but `story.ts` already imports both
   `Rfc` and `Event` (`story.ts:3-4`), which is everything the rule queries.
   Rails declares `after_save :close_rfc_if_complete` in the `Story` body.
6. **`console.log` for application logging.** `rfc-close.ts:84`. Rails uses
   `Rails.logger.info`; trails has `Trails.logger`
   (`packages/trailties/src/rails.ts:47`).
7. **`Base.transaction`** in `story.ts:289,324,348,379` and
   `app/controllers/mutations-controller.ts:184`. Inside a model, Rails writes
   `transaction do` (so `Story.transaction`); elsewhere,
   `ApplicationRecord.transaction`.
8. **Hand-decoded JSON columns.** `jsonArrayColumn` (`rfc.ts:17-25`) is called
   by every reader of `packages` / `clusters` / `related_rfcs`
   (`rfc-pages-controller.ts:143`, `story-pages-controller.ts:105,224`,
   `serializers/rfc-json.ts:39-42`). Rails declares the column's coding once:
   `serialize :packages, coder: JSON, type: Array`
   (`activerecord/lib/active_record/attribute_methods/serialization.rb:183`).
   trails' `serialize` takes `coder: JSON`
   (`packages/activerecord/src/attribute-methods/serialization.ts:16,55`).
   `ingest` writes these columns as text, so check that a `null` and an
   unparseable value still read as `[]`, which is the reason `jsonArrayColumn`
   exists. If `serialize` can't express that, file it against the framework and
   keep the helper until it can.
9. **`Meta.get` / `Meta.set`** (`meta.ts:11-24`) hand-roll
   find-then-save-or-create. The Rails spelling is
   `Meta.findOrInitializeBy({ key }).update({ value })`.

`pinTimestampColumns` (`app/models/timestamps.ts`), which reaches into three
private caches, is NOT in scope here. It is a framework gap, filed as
`model-cannot-override-timestamp-attributes-for-update` (RFC 0155). Replace it
with a `static timestampAttributesForUpdate()` override after that lands and
trailmap re-vendors.

## Acceptance criteria

- Every model extends `ApplicationRecord`, which calls `primaryAbstractClass()`.
- No `_tableName` / `_primaryKey` statics remain. Anything non-conventional
  uses `this.tableName = ...` / `this.primaryKey = ...`, and nothing here is
  non-conventional.
- No `foreignKey:` option that equals the derived default.
- Both `ingest`-context validations are written without `as unknown as` casts.
- The auto-close rule is an `afterSave` declared in `Story`'s class body, and
  `registerRfcAutoClose` is gone. `test/models/rfc-close.test.ts` still passes.
- `console.log` in `app/` is replaced by `Trails.logger`.
- `Base.transaction` in `app/` is replaced by `Story.transaction` /
  `ApplicationRecord.transaction`.
- The three JSON array columns are declared with `serialize(..., { coder: JSON })`
  and read as arrays, with `jsonArrayColumn` deleted. Otherwise a framework
  story is filed naming exactly what `serialize` could not express.
- `pnpm test`, `pnpm build` and `pnpm gate` pass unchanged.
