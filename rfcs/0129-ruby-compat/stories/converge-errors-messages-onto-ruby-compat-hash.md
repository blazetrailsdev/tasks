---
title: "Converge Errors#messages and #to_hash onto the ruby-compat Hash default seat"
status: done
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 45
pr: 7345
claim: "2026-09-01T16:14:07Z"
assignee: "converge-errors-messages-onto-ruby-compat-hash"
blocked-by: null
closed-reason: null
---

## Context

`Errors#details` converged in PR #7313 (RFC 0129) from a hand-patched `Map` to
`new Hash(EMPTY_ARRAY)` from `@blazetrails/ruby-compat`, whose `get` falls back
to the stored default (`ruby-compat/src/hash.ts:249-252`) exactly as
`hash.default = EMPTY_ARRAY` does in Ruby.

`Errors#messages` (`packages/activemodel/src/errors.ts:115-120`) is the same
Rails shape and still carries the pattern `details` just left behind:

```ts
get messages(): Map<string, readonly string[]> {
  const hash = this.toHash();
  hash.get = (attribute: string) => Map.prototype.get.call(hash, attribute) ?? EMPTY_ARRAY;
  return hash;
}
```

Rails (`activemodel/lib/active_model/errors.rb:268-274`):

```ruby
def messages
  hash = to_hash
  hash.default = EMPTY_ARRAY
  hash.freeze
  hash
end
```

Two divergences: the per-instance `get` override is not a `default` seat (`??`
also substitutes for a stored `nil`, which `Hash#default` does not), and
`toHash` (`errors.rb:256-261`) is itself a hand-rolled loop where Rails is
`group_by_attribute.transform_values { |errors| errors.map(&message_method) }`.

## Converged shape

`toHash` returns `transformValues(this.groupByAttribute(), …)` populated into a
ruby-compat `Hash`, and `messages` sets `EMPTY_ARRAY` as that `Hash`'s default —
the `details` shape, one file over. `hash.freeze` has no seat on either side
today and is out of scope for this story.

## Acceptance criteria

- `messages` and `toHash` use `Hash` / `transformValues` from
  `@blazetrails/ruby-compat`; no `Map.prototype.get.call` override remains in
  `errors.ts`.
- `packages/activemodel/src/errors.test.ts` green with no test-name change.
- `pnpm parity:api:calls:ruby-compat` green; delete any baseline row this
  converges rather than reseeding.
