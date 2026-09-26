---
title: "test-model-remaining-ivar-field-initializers"
status: ready
updated: 2026-09-26
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

Follow-up to `test-model-attr-accessor-field-initializers-clobber-construct-block` (trails#8112), which converged every `attr_accessor`-backed field (`cpk`, `contract`, `DevWithAfterTouch`, `topic`, `bird`, `pirate`, `author`, `project`) to `declare`.

The same shape — an initialized class field for a Ruby `attr_reader` or bare `@ivar ||=` ivar, which JS runs after `Base`'s constructor has run the `new`/`create` block — remains in other canonical test models under `packages/activerecord/src/test-helpers/models/`:

- `company.ts:141` `_log = []` — `company.rb:105` `@log ||= []`
- `chef.ts:43-48`, `eye.ts:84-89` `*CallbacksCounter = 0` — `chef.rb:13-19,34-59` / `eye.rb:53-...` `attr_reader`, lazily `||= 0` in the callbacks
- `eye.ts:15-18` `after*CallbacksStack = []`, `overrideIrisWithReadOnlyForeignKeyColor = false` — `eye.rb:4-6,24-34` `(@x ||= []) << ...`
- `contextual-callbacks-developer.ts:7` `history = []` — check its Rails counterpart

## Acceptance criteria

- Each field above is `declare`d with no initializer.
- Where Rails seeds the value (`||=` in the callback), the seed is ported at that Rails site, not as a field default.
- The tests that use these models stay green.
