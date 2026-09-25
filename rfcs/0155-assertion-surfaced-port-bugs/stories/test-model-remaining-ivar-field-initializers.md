---
title: "test-model-remaining-ivar-field-initializers"
status: draft
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `test-model-attr-accessor-field-initializers-clobber-construct-block`, which converged the four models it named (`cpk.ts` `failDestroy`, `contract.ts` `hiCount`/`byeCount`, `developer.ts` `DevWithAfterTouch#afterTouchCalled`, `topic.ts` `afterTouchCalled`) to `declare` fields, and moved Topic's `0` seed to `after_initialize` (`test/models/topic.rb:89-97`).

The same shape — an initialized class field for a Ruby `attr_accessor` / `attr_reader` ivar, which JS runs after `Base`'s constructor has run the `new`/`create` block — remains in other canonical test models under `packages/activerecord/src/test-helpers/models/`:

- `bird.ts:13-15` `cancelSaveFromCallback = false`, `totalCount = 0`, `enableCount = false` — `bird.rb:14,20-24` (`attr_accessor`, seeded in `after_initialize`)
- `pirate.ts:26` `cancelSaveFromCallback = false` — `pirate.rb:67` `attr_accessor :cancel_save_from_callback, :parrots_limit`
- `author.ts:167` `postLog = []` — `author.rb:239-240` `attr_accessor :post_log` + `after_initialize :set_post_log`
- `project.ts:26` `developersLog = []` — `project.rb:29-30` `attr_accessor :developers_log` + `after_initialize :set_developers_log`
- `company.ts:141` `_log = []` — `company.rb:105` `@log ||= []`
- `chef.ts:43-48`, `eye.ts:84-89` `*CallbacksCounter = 0` — `chef.rb:13-19,34-59` / `eye.rb:53-...` `attr_reader`, lazily `||= 0` in the callbacks
- `eye.ts:15-18` `after*CallbacksStack = []`, `overrideIrisWithReadOnlyForeignKeyColor = false` — `eye.rb:4-6,24-34` `(@x ||= []) << ...`
- `contextual-callbacks-developer.ts:7` `history = []` — check its Rails counterpart

## Acceptance criteria

- Each field above is `declare`d with no initializer.
- Where Rails seeds the value (`after_initialize`, or `||=` in the callback), the seed is ported at that Rails site, not as a field default.
- The tests that use these models stay green.
