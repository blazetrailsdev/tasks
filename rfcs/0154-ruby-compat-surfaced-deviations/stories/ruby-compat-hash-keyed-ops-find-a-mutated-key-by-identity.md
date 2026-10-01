---
title: "ruby-compat-hash-keyed-ops-find-a-mutated-key-by-identity"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A Ruby `Hash` finds an entry only through the key's CURRENT `hash`, then
`eql?`. A key mutated after insertion hashes to a different bin, so every keyed
operation misses it until `rehash` or `shift`
(`vendor/ruby/v3.3.11/hash.c:2084` `hash_stlike_lookup`, `:2367-2388`
`rb_hash_stlike_delete` / `rb_hash_delete_entry`):

```ruby
k = [1]; h = { k => "a" }; k << 2
h[k]        # => nil
h.key?(k)   # => false
h.delete(k) # => nil, h.size still 1
h[k] = "b"  # h.size => 2
h.rehash    # h.size => 1
```

ruby-compat's `Hash#hashStlikeLookup` (`packages/ruby-compat/src/hash.ts`)
returns the probe key itself when no stored key is `eql?` to it
(`… ?? key`), and the callers then ask the underlying `Map`, which matches the
SAME object by identity. So `get` / `has` / `delete` find a mutated key Ruby
misses, and `set` overwrites its entry where Ruby adds a second one. This
predates trails#8344 (it shipped with the `eql?`-keyed lookup in trails#8154);
trails#8344 made `shift` remove by the entry's stored hash (`#stHash`, MRI
`st_table_entry.hash`, `vendor/ruby/v3.3.11/st.c:134`), which is the seat this
needs.

## Acceptance criteria

- For an object key outside `compareByIdentity()`, `get`, `has`, `delete` and
  `set` reach a stored entry only when the probe's current `rbHash` selects the
  bin the entry was stored under and `rbEql` matches. An identical object whose
  `hash` has changed is a miss: `get` answers the default, `has` is false,
  `delete` returns `nil` (or the block's value) and leaves the entry, `set`
  adds a second entry.
- `Hash#rehash` (`vendor/ruby/v3.3.11/hash.c:2015` `rb_hash_rehash`) is ported
  only if a trails caller needs it (the package's rule 1); otherwise the
  entry stays reachable through `shift` and iteration alone, as in Ruby.
- `hash.trails.test.ts` covers each arm with a mutated Array key, the values
  checked against `ruby`.
