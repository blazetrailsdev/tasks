---
title: "activesupport: try! has two ports, one rejecting readers, and neither is public_send"
status: draft
updated: 2026-10-02
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Object#try!` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/try.rb:20-30`)
is `public_send(*args, &block)` for a non-nil receiver, so it answers any public method, a reader
included.

trails has two ports that disagree:

- `tryBang` in `packages/activesupport/src/try.ts` throws `TypeError` unless the member is a
  function, so a reader ported as an accessor property raises where Ruby answers.
  `PredicateBuilder#expandFromHash`'s aggregate arm (`relation/predicate_builder.rb:137`,
  `object.try!(aggregate_attr)`) failed eight `FinderTest` aggregate cases through it
  ("undefined method 'street' for [object Object]") during trails#8354.
- `Tryable.tryBang` in `packages/activesupport/src/core-ext/object/try.ts` (the file mirroring
  `try.rb`) reads a zero-arg reader, and is what the predicate builder now calls.

Both raise `TypeError` where `public_send` raises `NoMethodError`, and neither dispatches through
ruby-compat's `rbFPublicSend`, which already answers accessors and `methodMissing`.

## Acceptance criteria

- [ ] One `try!` port, in `core-ext/object/try.ts`, dispatching through `rbFPublicSend`; the
      `try.ts` duplicate is removed and its importers moved.
- [ ] `try` likewise follows `try.rb:7-17` (`respond_to?(args.first)` then `public_send`).
- [ ] `core-ext/object/try.test.ts` asserts `NoMethodError` where Rails' `try_test.rb` does.
