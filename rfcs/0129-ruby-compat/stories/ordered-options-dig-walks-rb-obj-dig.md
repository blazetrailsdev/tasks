---
title: "OrderedOptions#dig walks rb_obj_dig's loop instead of indexing intermediates directly"
status: ready
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`OrderedOptions#dig` is two lines
(`vendor/rails/activesupport/lib/active_support/ordered_options.rb:44-46`):

```ruby
def dig(key, *identifiers)
  super(key.to_sym, *identifiers)
end
```

`super` is `rb_hash_dig` (`vendor/ruby/hash.c:4627`) — `rb_hash_aref` for the
first key, then `rb_obj_dig` (`vendor/ruby/object.c:3906`) for the rest.

`packages/activesupport/src/ordered-options.ts:103-110` open-codes that walk
instead, and it diverges from `rb_obj_dig` in two ways:

- **The TypeError is missing.** `rb_obj_dig` raises
  `"%"PRIsVALUE" does not have #dig method"` through `no_dig_method`
  (`vendor/ruby/object.c:3897-3900`) for an intermediate that answers no
  `dig`; ours returns `undefined` from the `typeof value !== "object"` guard.
- **An intermediate is indexed directly rather than asked.** `rb_obj_dig`
  dispatches per intermediate — `rb_hash_aref` for a Hash, `rb_ary_at` for an
  Array, and the object's OWN `dig` for anything else that defines one
  (`dig_basic_p`). Ours is `(value as any)[identifier]`, which skips a nested
  `HashWithIndifferentAccess`'s key conversion and its default seat.

This is the same `rb_obj_dig` gap as
`hwia-dig-variadic-arm-and-rb-obj-dig-typeerror`, in a second class. Land that
one first if both are open — the walk is the same and should be spelled the
same way in both, and `HashWithIndifferentAccess#dig` is the one with call
sites outside its own tests.

The same caution applies here: today's silent `undefined` is what
`ordered-options.test.ts:73-79` (`it("nested dig")`) is written against, and
that test digs an Array intermediate (`a.dig("testKey", 0, "a")`), so the Array
arm has to keep working while the TypeError arm is added.

## Acceptance criteria

- `OrderedOptions#dig`'s walk mirrors `rb_obj_dig`'s loop: `nil` ends it, an
  Array intermediate goes through `rb_ary_at`, an object that defines `dig` is
  handed the remaining identifiers, anything else raises `TypeError` with
  `"<class> does not have #dig method"`.
- `it("nested dig")` and `it("string dig")` (`ordered-options.test.ts:61-79`)
  keep their names and keep passing.
- A regression test per newly-covered arm that fails on the baseline.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args` show no new
  rows; activesupport green.
