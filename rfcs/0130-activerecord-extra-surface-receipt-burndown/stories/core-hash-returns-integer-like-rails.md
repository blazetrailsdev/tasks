---
title: "Core#hash returns an Integer (core.rb:641-649), not a string/Symbol token; rbHash([record]) throws"
status: draft
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::Core#hash` (`vendor/rails/activerecord/lib/active_record/core.rb:641-649`) returns an Integer: `self.class.hash ^ id.hash` when the primary key values are present, otherwise `super` (`Object#hash`, identity).

trails' `hash` (`packages/activerecord/src/core.ts`, next to `equals` / `eql`) returns a string, `"<ctorToken>#<serialized id>"`, or a per-record `Symbol` when the id is absent. It relies on the module-level `constructorToken` / `serializeIdForHash` / `lengthPrefixed` helpers, which Rails does not have.

ruby-compat `rbHash` (`packages/ruby-compat/src/rb-hash.ts`) returns whatever `hash()` returns, typed as `number`. `uniq` keys a `Map` on it, which works for strings and symbols. But `rbHash`'s Array arm computes `h ^= rbHash(element)`. With a string it silently yields 0, so every array holding records collides. With a Symbol it throws `TypeError: Cannot convert a Symbol value to a number`. So `rbHash([Post.new])` raises.

`has-many-through-association.ts:77-85` keys a `distribution` Map on `record.hash()`. Rails keys a Hash on the record itself, using `hash` + `eql?`.

## Acceptance criteria

- `hash()` returns a number: `rbHash(this.constructor) ^ rbHash(this.id)` when `isPrimaryKeyValuesPresent()`, otherwise an identity hash. If needed, export ruby-compat's `identityHash` for that.
- The `constructorToken` / `serializeIdForHash` / `lengthPrefixed` helpers are deleted.
- The `distribution` Map in `has-many-through-association.ts` keys on hash + `rbEql`, not on a raw `hash()` value. Integer hashes can collide, and Ruby's Hash disambiguates with `eql?`.
- These still pass: `base.test.ts` "records without an id have unique hashes" and "records of different classes have different hashes" (`base_test.rb:1762-1768`). `rbHash([new Post()])` does not throw.
