---
title: "parity:fixtures: extract-ruby-models qualifies a class nested in a class body"
status: draft
updated: 2026-10-01
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/fixtures-compare/extract-ruby-models.rb` tracks nesting with a keyword-count depth approximation
(`parse_file`, the `opens` / `closes` scan). It qualifies a class by its enclosing **modules** only, so a
class nested in a class body — `Post::CategoryPost` (`vendor/rails/v8.0.2/activerecord/test/models/post.rb`),
`Shop::Product::Type` (`models/shop.rb:12`), `MyApplication::Business::Client::Contact`
(`models/company_in_module.rb:22`) — is recorded under its last segment.

Qualifying by the class stack was tried in trails#8332 and reverted: the depth count misreads sibling
top-level classes as nested (`BookDestroyAsyncWithScopedTags` came out as
`BookDestroyAsync::BookDestroyAsyncWithScopedTags`, and `DeadParrot` as nested in `Parrot`), so the class
stack is not popped reliably.

Consequences in `scripts/fixtures-compare/compare.ts`:

- `fixtureTable` looks a file's `_fixture.model_class` up by its last segment as a fallback
  (`classes.get(fileModelClass.split("::").pop()!)`), which can match the wrong same-named class.
- `computeTableName`'s `contained` arm — Rails' "nested classes are prefixed with singular parent table
  name" (`activerecord/lib/active_record/model_schema.rb:608-613`) — only fires when the namespace of
  `qualifiedName` is a manifest class, which never happens for class-body nesting.
- `belongsToAssociationsByClass` misses `Post::CategoryPost`-style keys.

## Acceptance criteria

- [ ] The extractor pops its class and module stacks correctly for every file under
      `vendor/rails/v8.0.2/activerecord/test/models/` (a real tokenizer or `Ripper`, not a keyword count), and
      `qualifiedName` includes enclosing classes as well as modules.
- [ ] `fixtureTable`'s last-segment lookup is deleted; `Post::CategoryPost` resolves by its full name.
- [ ] A test covers `compute_table_name`'s `contained` arm against a class-body-nested model from the real
      manifest.
- [ ] `pnpm parity:fixtures` stays at diff 0 and `pnpm parity:fixtures:models` output is unchanged apart from
      the corrected qualified names.
