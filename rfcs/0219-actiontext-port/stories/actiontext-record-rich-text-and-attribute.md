---
title: "Port ActionText::Record, RichText, Serialization and has_rich_text"
status: ready
updated: 2026-11-07
rfc: "0219-actiontext-port"
cluster: at-models
packages: ["actiontext"]
deps:
  [
    "actiontext-migration-and-test-database",
    "actiontext-content-and-rendering",
    "activestorage-attached-many",
  ]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/v8.0.2/actiontext/app/models/action_text/record.rb` (11): abstract base, load hook.
- `app/models/action_text/rich_text.rb` (93): `serialize :body, coder:
ActionText::Content` (`:39`), `delegate :to_s, :nil?, to: :body` (`:40`),
  `belongs_to :record, polymorphic: true, touch: true` (`:46`),
  `has_many_attached :embeds` (`:52`), the `before_save` assigning
  `self.embeds = body.attachables.grep(ActiveStorage::Blob).uniq` (`:54-56`),
  `to_plain_text`, `to_trix_html`, and the `delegate :blank?, :empty?,
:present?, to: :to_plain_text` (`:89`).
- `lib/action_text/serialization.rb` (38): `load` / `dump` class methods,
  `_load` alias, `_dump`.
- `lib/action_text/attribute.rb` (105): `has_rich_text` (`:53-92`), its
  generated `name`, `name?`, `name=` (both `store_if_blank` arms), the
  `has_one :"rich_text_#{name}"` with `strict_loading`, the two scopes, and
  `with_all_rich_text` / `rich_text_association_names` (`:95-102`).

## Acceptance criteria

- `has_rich_text` defines the three members on the generated-association
  module with no string eval (RFC "`has_rich_text` defines methods without
  string eval"); `name?` is `isName`; `name=` is a sync setter.
- The reader and `name=` follow the RFC's open question 1, and `isName` /
  `RichText`'s delegated predicates follow open question 5, as the owner
  decides.
- `before_save` awaits `body.attachables`; `serialize`'s coder stays sync.
- `before_save`'s `self.embeds =` is `await this.setEmbeds(...)`, the
  activestorage async writer (RFC 0209 Decisions); `grep(ActiveStorage::Blob)`
  is a `filter` on `instanceof Blob`.
- `serialize :body, coder: Content` round-trips through `Serialization`.
- `Attribute` is included into `ActiveRecord::Base` by the engine story;
  this story's tests include it in their setup the same way.
