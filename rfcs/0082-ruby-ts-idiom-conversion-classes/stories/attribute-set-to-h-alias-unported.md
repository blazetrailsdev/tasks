---
title: "Ruby alias to_h is unported on AttributeSet because parity:api does not count alias targets"
status: draft
updated: 2026-09-20
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `attribute_set_test.rb` in trails#7899.

Rails' `AttributeSet` exposes the same method under two names
(`activemodel/lib/active_model/attribute_set.rb:36-39`):

```ruby
def to_hash
  keys.index_with { |name| self[name].value }
end
alias :to_h :to_hash
```

`attribute_set_test.rb:80-86` asserts both spellings, which is the point of the
test:

```ruby
assert_equal({ foo: 1, bar: 2.2 }, attributes.to_hash)
assert_equal({ foo: 1, bar: 2.2 }, attributes.to_h)
```

trails ports only `toHash` (`packages/activemodel/src/attribute-set.ts:170-176`);
there is no `toH`. So a trails caller reaching for Rails' `to_h` — the spelling most
Ruby code uses, and the one Ruby's own `Hash()` / double-splat conversion protocol
looks for — gets `undefined`. The converged test has to assert `toHash()` twice to
keep Rails' assertion count, which is honest but says nothing about the alias.

This is the Ruby-`alias`/`alias_method` conversion class, not a one-off: **the reason
the alias was dropped is that `parity:api` does not count it.** `attribute_set.rb`
measures 23/23 100% ✓ with `to_h` absent, because the Ruby extractor does not put
alias targets in the compared population — so adding `toH` today registers as
_extra surface_ rather than closing a missing row, and the gate actively discourages
the faithful port. Any other Rails alias in the packages is in the same position.

### Converged shape

`toH` beside `toHash` in `attribute-set.ts`, in Rails' order (`to_hash` then the
alias), delegating rather than duplicating the body — the TS spelling of
`alias :to_h :to_hash`. Because the gate treats it as novel surface, the story also
owes the tooling half: either teach the Ruby extractor to emit alias targets (so an
alias port credits as a match, which fixes the class), or, if that is too wide for
one story, land `toH` with the narrowest receipt that does not claim the deviation is
permanent and file the extractor half separately. Do NOT close this by deciding
trails ships one spelling.

Second assertion in `attribute_set_test.rb:80-86` should then read `toH()`, not a
repeat of `toHash()`.

## Acceptance criteria

- [ ] `AttributeSet#toH` exists and delegates to `toHash`, mirroring
      `attribute_set.rb:39`.
- [ ] `attribute-set.test.ts`'s "to_hash returns a hash of the type cast values"
      asserts `toHash()` then `toH()`, two assertions, values unchanged.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api --package activemodel` are
      green, with a decision recorded on whether Ruby alias targets join the compared
      population (the general fix) or the extractor half is filed on its own.
- [ ] `pnpm parity:test -- --package activemodel --assertions` still reports 0
      count/kind/value mismatches for `attribute_set_test.rb`.
