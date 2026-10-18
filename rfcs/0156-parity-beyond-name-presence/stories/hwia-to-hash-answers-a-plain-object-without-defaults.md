---
title: "hwia-to-hash-answers-a-plain-object-without-defaults"
status: in-progress
updated: 2026-10-18
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#9024
claim: "2026-10-18T01:28:24Z"
assignee: "hwia-to-hash-answers-a-plain-object-without-defaults"
blocked-by: null
closed-reason: null
---

## Context

Rails' `HashWithIndifferentAccess#to_hash`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/hash_with_indifferent_access.rb:376-381`)
copies into a plain `Hash`, and `to_h` is the inherited `Hash#to_h`, which on a
Hash subclass answers a plain Hash. `ActiveJob::Arguments#transform_symbol_keys`
calls `hash.to_h.transform_keys` precisely so a HWIA becomes an ordinary Hash
(`vendor/rails/v8.0.2/activejob/lib/active_job/arguments.rb:177-188`).

trails' `HashWithIndifferentAccess#toHash`
(`packages/activesupport/src/hash-with-indifferent-access.ts:580-590`) answers a
ruby-compat `Hash` (a `Map` subclass) even when no default or default proc is
set. Per CLAUDE.md, a Ruby Hash is a plain object unless it needs a `Hash`
feature (`packages/ruby-compat/README.md`, "When a Ruby Hash is a Hash and when
it is an object"). So `ActiveJob::Arguments.deserialize` of
`{ "a" => 1, "_aj_symbol_keys" => ["a"] }.with_indifferent_access` answers a
`Map` where Rails answers `{ a: 1 }`. Surfaced by the Ruby→TS codegen spike's
port of `argument_serialization_test.rb` ("deserialize a hash").

## Acceptance criteria

- `HashWithIndifferentAccess#toHash` / `toH` answer a plain object when the
  result needs no `Hash` feature (no default, no default proc), and a ruby-compat
  `Hash` only when it does, following the ruby-compat README rule.
- `ActiveJob::Arguments.deserialize([indifferent_access_symbol_key])` answers
  `{ ":a": 1 }`, as the Rails test expects `{ a: 1 }`.
- Existing activesupport HWIA tests and activejob arguments tests pass.
