---
title: "rack, activesupport: Rack::Headers, HashWithIndifferentAccess and OrderedHash redefine each where Ruby inherits Hash#each"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8416 gave ruby-compat's `Hash` an `each` (`packages/ruby-compat/src/hash.ts`,
`rb_hash_each_pair`, `vendor/ruby/v3.3.11/hash.c:3149,7219`) and included `Enumerable` into it
(`hash.c:7184`). Three `Hash` subclasses still carry their own `each`, which their Ruby
counterparts inherit:

- `Rack::Headers` (`packages/rack/src/headers.ts:68`): `vendor/rack/v3.1.14/lib/rack/headers.rb:8`
  is `class Headers < Hash` and defines no `each`. The same holds for its `eachKey` /
  `eachValue` (`headers.ts:75,81`).
- `ActiveSupport::HashWithIndifferentAccess`
  (`packages/activesupport/src/hash-with-indifferent-access.ts:465`):
  `vendor/rails/v8.0.2/activesupport/lib/active_support/hash_with_indifferent_access.rb` defines
  no `each`.
- `ActiveSupport::OrderedHash` (`packages/activesupport/src/ordered-hash.ts:130-170`): `each`,
  `eachPair`, `eachKey` and `eachValue`, each with a blockless arm returning a `MapIterator`;
  `vendor/rails/v8.0.2/activesupport/lib/active_support/ordered_hash.rb` defines none of them.

The three overrides disagree on what the block receives (`(key, value)`, one pair, `(key, value)`)
and one of them answers an iterator Ruby's `each` answers an Enumerator for.

## Acceptance criteria

- [ ] The overrides are deleted and each class inherits `Hash#each`; `eachPair` / `eachKey` /
      `eachValue` come from ruby-compat's Hash (members added there with their `hash.c` citation
      if a caller needs them as methods).
- [ ] Callers that relied on a blockless `each()` iterator are converted.
- [ ] `pnpm parity:api:extra:gate` stays green; activesupport and rack tests pass.
