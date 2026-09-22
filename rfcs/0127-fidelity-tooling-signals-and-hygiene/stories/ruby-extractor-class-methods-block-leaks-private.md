---
title: "ruby-extractor-class-methods-block-leaks-private"
status: draft
updated: 2026-09-22
rfc: "0127-fidelity-tooling-signals-and-hygiene"
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

`scripts/api-compare/extract-ruby-api.rb` records visibility from
`@visibility_stack`, but its generic `:method_add_block` arm (`:576-598`) walks a
block's children without pushing a visibility scope. So a bare `private` inside
`class_methods do … end` flips the ENCLOSING module's visibility for the rest of
the file.

Concrete instance: `vendor/rails/activerecord/lib/active_record/encryption/encryptable_record.rb`
has `private` at `:69`, inside `class_methods do` (`:16-143`). Every
instance method after the block — `encrypted_attribute?` (`:146`),
`ciphertext_for` (`:157`), `encrypt` (`:166`), `decrypt` (`:171`), all public
in Rails (the file's own `private` is at `:175`) — lands in
`output/rails-api.json` as `"visibility":"private"`. `eslint/rails-private-methods.json`
inherits it, and `blazetrails/rails-private-jsdoc` then DEMANDS `@internal` on
the trails ports in `packages/activerecord/src/encryption/encryptable-record.ts`
and on their `Base` interface declarations in `base.ts`, holding public Rails API
out of the website reference.

Surfaced by `relocate-encryption-hooks-onto-encryptable-record`, which had to
keep those `@internal` tags to stay green.

## Acceptance criteria

- A `class_methods do … end` block (and any other Concern block the extractor
  descends into) scopes its own `private`/`protected`/`public`: push a
  visibility frame around the block walk and pop it after, so the module's
  visibility after the block is what it was before it.
- `encrypted_attribute?`, `ciphertext_for`, `encrypt`, `decrypt` extract as
  public from `encryptable_record.rb`; a regression test in
  `scripts/api-compare/` pins it.
- The now-unearned `@internal` tags on those four in `encryptable-record.ts` and
  `base.ts` are removed; re-check other files the fix flips.
