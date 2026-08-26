---
title: "Fragments inherits the generic Node eql/hash and has no initialize_copy"
status: done
updated: 2026-08-26
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 7102
claim: "2026-08-26T20:10:48Z"
assignee: "arel-node-predicate-inlined-at-three-call-sites"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/lib/arel/nodes/fragments.rb` defines six members;
`packages/arel/src/nodes/fragments.ts` ports three.

Missing:

```ruby
# fragments.rb:13-15
def initialize_copy(other)
  super
  @values = @values.clone
end

# fragments.rb:17-19
def hash
  [@values].hash
end

# fragments.rb:28-32
def eql?(other)
  self.class == other.class &&
    self.values == other.values
end
alias :== :eql?
```

trails' `Fragments` inherits `Node#eql` / `Node#hash`, which are a generic
`stableSerialize` comparison over all fields rather than the per-class pair
Rails defines (the same shortcoming `node-eql-is-a-generic-serializer-not-per-class-eql`
tracks at the base class). For `Fragments` specifically the Ruby methods key on
`@values` ALONE, and `nodes/fragments_test.rb:11-18`'s `array.uniq.size`
assertions are what depend on that.

`values` is also declared `readonly` in TS, which forecloses the
`initialize_copy` port outright.

Surfaced in PR #7079 (RFC 0122) while porting `fragments_test.rb`; the tests
pass on the inherited generic pair today, so this is latent rather than red.

## Converged shape

`Fragments` declares its own `hash` and `eql` keyed on `values`, plus the
`initialize_copy` clone of `@values` — reachable through whatever clone shape
`node-clone-builds-a-fresh-instance-not-a-copy` settles on. Drop `readonly` from
`values` so the copy can be reassigned, as Rails' ivar is.

## Acceptance criteria

- [ ] `Fragments#hash` / `#eql` key on `values` alone, per fragments.rb:17-19,28-32.
- [ ] Cloning a `Fragments` gives it its own `values` array (fragments.rb:13-15),
      asserted directly.
- [ ] `nodes/fragments_test.rb`'s four tests stay green and stay mirrored.
