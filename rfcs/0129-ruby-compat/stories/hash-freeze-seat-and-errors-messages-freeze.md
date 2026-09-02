---
title: "hash-freeze-seat-and-errors-messages-freeze"
status: in-progress
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 67
pr: 7394
claim: "2026-09-02T17:24:58Z"
assignee: "ruby-compat-hash-fetch-block-arm"
blocked-by: null
closed-reason: null
---

## Context

`Errors#messages` and `#details`
(`vendor/rails/activemodel/lib/active_model/errors.rb:268-274` and `:277-283`)
both end with `hash.freeze` before returning:

```ruby
def messages
  hash = to_hash
  hash.default = EMPTY_ARRAY
  hash.freeze
  hash
end
```

PR #7345 converged the `default` seat of both onto `@blazetrails/ruby-compat`'s
`Hash` (`packages/activemodel/src/errors.ts`, `messages` and `details`), and
noted `hash.freeze` as having no seat on either side and being out of scope.
It still has none: the returned `Hash` is mutable in trails, so a caller can
`errors.messages.set(...)` and silently write into a value Rails hands back
frozen — the `RuntimeError: can't modify frozen Hash` Rails raises there is a
behaviour our port does not have.

`Object#freeze` is `rb_obj_freeze` (`vendor/ruby/object.c`), and
`packages/ruby-compat/src/` is where the Ruby core seat for it belongs — a
`Map` subclass cannot be frozen by `Object.freeze` (that only seals properties,
not the backing entries), so the seat has to be a flag the mutators check, the
way MRI's `rb_hash_modify_check` (`vendor/ruby/hash.c`) does.

## Converged shape

`Hash` carries a `frozen?`/`freeze` pair mirroring `rb_obj_freeze` and
`rb_hash_modify_check`: `set`, `delete`, `clear` and every other mutator raise
`FrozenError` (`can't modify frozen Hash: <inspect>`) once frozen.
`Errors#messages` and `#details` then call `hash.freeze()` at the Rails line,
and `HashWithIndifferentAccess` / `Rack::Headers` inherit the check for free
the way they now inherit the default seat.

## Acceptance criteria

- `Hash#freeze` / `Hash#isFrozen` in `packages/ruby-compat/src/hash.ts`, each
  with a `@noRailsEquivalent PERMANENT` receipt naming its MRI line; mutators
  raise `FrozenError` with MRI's message.
- `errors.ts`'s `messages` and `details` call it, at the Rails line, and a test
  pins that writing through the returned hash raises — failing on the baseline.
- `pnpm parity:api:extra:gate` — ruby-compat's `total` mark raised only as this
  story's reviewed step; `novel` stays 0 via the receipts.
