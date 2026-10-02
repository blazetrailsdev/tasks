---
title: "activesupport: HashWithIndifferentAccess#transform_keys! drops the to_enum arm"
status: draft
updated: 2026-10-02
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::HashWithIndifferentAccess#transform_keys!`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/hash_with_indifferent_access.rb:345-359`)
opens with an arm the trails port does not have:

```ruby
def transform_keys!(hash = NOT_GIVEN, &block)
  return to_enum(:transform_keys!) if NOT_GIVEN.equal?(hash) && !block_given?

  if hash.nil?
    super
  elsif NOT_GIVEN.equal?(hash)
    keys.each { |key| self[yield(key)] = delete(key) }
  ...
```

`packages/activesupport/src/hash-with-indifferent-access.ts` (`transformKeysBang`) starts at the
`if hash.nil?` chain. With neither a hash nor a block it reaches the `NOT_GIVEN === hash` arm and
calls `block!(key)` on `undefined`, a `TypeError`, where Rails answers an Enumerator.

The gap was invisible to `pnpm parity:api:arms:report --package=activesupport` until the arms
extractor stopped counting the leading `if (typeof hash === "function") { block = hash; hash =
NOT_GIVEN; }` guard as an arm (it moves the block out of the positional slot, which Ruby does at the
call). That invented `if` had been pairing off against Rails' real one, so the row read `+if` with
nothing missing. It now reads one missing `if`.

## Acceptance criteria

- [ ] `transformKeysBang()` with no hash and no block answers the port of
      `to_enum(:transform_keys!)`, as the first statement of the body, with a test.
- [ ] `pnpm parity:api:arms:report --package=activesupport --direction=missing` no longer lists
      `hash-with-indifferent-access.ts#transformKeysBang`.
