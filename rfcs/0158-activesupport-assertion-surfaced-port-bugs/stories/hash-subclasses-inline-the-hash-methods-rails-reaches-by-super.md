---
title: "HashWithIndifferentAccess / OrderedHash inline the Hash#fetch, #replace and #slice Rails reaches by super"
status: draft
updated: 2026-10-02
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

Found while shipping `port-thor-core-ext-hash-with-indifferent-access` (trails PR 8362), which gave ruby-compat's `Hash` a `replace` method (`rb_hash_replace`, `vendor/ruby/v3.3.11/hash.c:2967`) and `Hash`-receiver arms for the free `slice`, `update` / `mergeBang` and `fetch` (`packages/ruby-compat/src/hash.ts`).

Three older `Hash` subclasses were ported before those existed, so they inline the Ruby core body where Rails calls `super`:

- `ActiveSupport::HashWithIndifferentAccess` (`vendor/rails/v8.0.2/activesupport/lib/active_support/hash_with_indifferent_access.rb`):
  - `fetch` is `super(convert_key(key), *extras)` (`:195-197`). trails re-implements the lookup, the default and the `KeyError`, with its own message string (`packages/activesupport/src/hash-with-indifferent-access.ts:145`).
  - `replace` is `super(self.class.new(other_hash))` (`:298-300`). trails is `super.clear()` then `this.update(...)` (`:241`).
  - `slice` is `keys.map! { convert_key }; self.class.new(super)` (`:361-364`). trails builds the result by hand (`:272`).
- `ActiveSupport::OrderedHash#replace` (`packages/activesupport/src/ordered-hash.ts:98`) clears and re-sets through its own `set`.
- `Rack::Headers#replace` (`vendor/rack/v3.1.14/lib/rack/headers.rb:167-170`) is `clear; update(hash)` and is faithful. PR 8362 added an `as this` cast to its return so it type-checks as an override; the cast goes once `update` returns `this`.

## Acceptance criteria

- `HashWithIndifferentAccess#fetch`, `#replace` and `#slice` are the one-line Rails bodies over ruby-compat's `fetch` / `Hash#replace` / `slice`, and the `KeyError` message is ruby-compat's (`key not found: "foo"` with MRI's inspect and ellipsis).
- `OrderedHash#replace` matches its Rails body, or is deleted if Rails does not define it.
- `Rack::Headers#update` returns `this` and `replace` carries no cast.
- `packages/activesupport/src/hash-with-indifferent-access*.test.ts`, `ordered-hash.test.ts` and `packages/rack/src/headers.test.ts` stay green; `parity:api:calls` and `:calls:args` are green with no new baseline row.
