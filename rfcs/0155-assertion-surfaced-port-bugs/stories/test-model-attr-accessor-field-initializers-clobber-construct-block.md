---
title: "Test models port attr_accessor as initialized class fields that clobber constructor-block writes"
status: ready
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
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

trails#8044 found that `Client`'s `attr_accessor`s (`test/models/company.rb:160-176`) were ported as class fields with `= false` initializers. JS runs those after `Base`'s constructor, which has already run the `new` / `create` block. So they silently overwrote values the block set, and `rollback_on_save` read `false` in `after_save`. The fix was `declare`, matching Ruby's `nil` default.

The same shape remains in other canonical test models:

- `cpk.ts:30` `failDestroy = false` — `cpk/book.rb:5` `attr_accessor :fail_destroy`
- `contract.ts:14-15` `hiCount = 0; byeCount = 0` — `contract.rb:13` `attr_accessor :hi_count, :bye_count`, lazily `||= 0` in the callbacks (`:16-22`)
- `developer.ts:614` `afterTouchCalled = false` (`DevWithAfterTouch`) — check its Rails counterpart
- `topic.ts:165` `afterTouchCalled = 0` — `topic.rb:89-92`, set to 0 in `after_initialize`, which the field initializer does not mirror

## Converged shape

`declare` each `attr_accessor` field, with no initializer. Where Rails seeds a value (`||= 0` in a callback, or `self.x = 0` in `after_initialize`), port that seeding at the Rails site instead of as a field default.

## Acceptance criteria

- No canonical test model declares an `attr_accessor`-backed field with an initializer.
- The tests that use these models stay green.
