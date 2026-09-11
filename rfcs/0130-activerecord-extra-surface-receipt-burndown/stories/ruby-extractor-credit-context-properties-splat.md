---
title: "ruby-extractor-credit-context-properties-splat"
status: done
updated: 2026-09-11
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 4
pr: trails#7715
claim: "2026-09-11T18:50:22Z"
assignee: "converge-loader-query-eql-and-hash-onto-rails"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Encryption::Context` declares `PROPERTIES = %i[ key_provider key_generator cipher
message_serializer encryptor frozen_encryption ]` and `attr_accessor(*PROPERTIES)`
(`vendor/rails/activerecord/lib/active_record/encryption/context.rb:13-15`);
`Configurable` delegates each via `Context::PROPERTIES.each { |name| delegate name, to: :context }`
(`encryption/configurable.rb:15-18`). The Ruby extractor (`scripts/api-compare/extract-ruby-api.rb`,
`process_attr` / `process_delegate`) does not resolve a splatted constant or a `CONST.each` loop, so
`message_serializer` — whose name exists nowhere else in Rails — scores `novel` on
`encryption/context.ts` and `encryption/configurable.ts`. The other five names only escape because
they collide with a definition elsewhere (scored `moved`).

Both TS members carry `@noRailsEquivalent CONVERGEABLE ruby-extractor-credit-context-properties-splat`.

## Acceptance criteria

- The Ruby extractor credits `attr_accessor(*CONST)` where `CONST` is a `%i[...]`/`[:a, ...]`
  literal in the same class, and `CONST.each do |name| delegate name, to: ... end`, with a test in
  `scripts/api-compare/extract-ruby-api.test.ts`.
- `messageSerializer` (and the other five) match on context.ts / configurable.ts; both receipts
  are deleted and the extra-surface mark tightened.
