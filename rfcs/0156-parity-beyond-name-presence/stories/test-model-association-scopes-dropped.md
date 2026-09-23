---
title: "test-model-association-scopes-dropped"
status: ready
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`parity:fixtures:models`' report-only declaration-drift section (models-compare-association-scopes-and-attr-declarations) lists Rails test-model associations declared with a scope lambda whose trails mirror has none. Beyond the two already filed (`topic-open-replies-scope`, and `book-destroy-async-model-drops-scope-and-published-override` for `BookDestroyAsyncWithScopedTags#tags`), the first run surfaced five more:

- `vendor/rails/activerecord/test/models/topic.rb:50` `has_many :approved_replies, -> { approved }, ...` — trails `packages/activerecord/src/test-helpers/models/topic.ts:122` has no scope.
- `vendor/rails/activerecord/test/models/author.rb:134` `has_many :categorizations, -> { }` — trails `author.ts:427` has no scope (empty lambda; port it as the empty scope Rails declares).
- `vendor/rails/activerecord/test/models/book.rb:8` `has_many :references, -> { distinct }, through: :citations, source: :reference_of` — trails `book.ts:155`.
- `vendor/rails/activerecord/test/models/developer.rb:82` `has_many :strict_loading_audit_logs, -> { strict_loading }, class_name: "AuditLog"` — trails `developer.ts:149` spells it as a `strictLoading: true` option instead of the scope.
- `vendor/rails/activerecord/test/models/invoice.rb:5` `has_many :shipping_lines, -> { from("shipping_lines") }, autosave: true` — trails `invoice.ts:16`.

## Acceptance criteria

- Each association above is declared with the scope lambda Rails declares, as the second argument to `this.hasMany`.
- `FIXTURES_COMPARE_VERBOSE=1 pnpm parity:fixtures:models` no longer lists these five rows in the declaration-drift section.
- Tests using these associations stay green on every adapter.
