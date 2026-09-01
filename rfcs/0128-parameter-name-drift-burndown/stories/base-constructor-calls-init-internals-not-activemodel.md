---
title: "base-constructor-calls-init-internals-not-activemodel"
status: ready
updated: 2026-09-01
rfc: "0128-parameter-name-drift-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In Rails, `init_internals` is DEFINED in several layers
(`activemodel/lib/active_model/validations.rb:467`,
`activemodel/lib/active_model/dirty.rb:372`, and the ActiveRecord layers) but
CALLED from exactly two places, both in ActiveRecord:

- `vendor/rails/activerecord/lib/active_record/core.rb:475` — `Core#initialize`
- `vendor/rails/activerecord/lib/active_record/core.rb:512` — `Core#init_with_attributes`

`ActiveModel::API#initialize` (`activemodel/lib/active_model/api.rb:80-84`) is
`assign_attributes(attributes) if attributes; super()` — it never calls
`init_internals`, so a plain ActiveModel model does not run that chain at all.

trails inverts this: `packages/activemodel/src/model.ts:142` calls
`this.initInternals()` from ActiveModel's constructor, and
`packages/activerecord/src/base.ts`'s constructor — which is where
`Core#initialize` is ported — reaches the whole `prepend()`ed chain wired at
`base.ts:3033-3043` only through `super(attrs)`. The call therefore happens,
but from the wrong layer, and in a package Rails never makes it from.

Surfaced by PR #7278: removing `InspectionMask`'s invented constructor
re-paired `core.rb#initialize` onto the constructor that actually ports it, and
`parity:api:calls` immediately flagged the missing `init_internals`. It is held
there by a `@missingRailsCall init_internals — CONVERGEABLE <this story>` tag on
`base.ts`'s constructor, since calling it a second time from AR would run every
layer twice.

## Acceptance criteria

- `Base`'s constructor calls `initInternals()` itself, as `core.rb:475` does,
  and `ActiveModel::Model#initialize` no longer does (`api.rb:80-84`).
- `initWithAttributes` likewise carries the `core.rb:512` call.
- The `@missingRailsCall init_internals` tag on `base.ts` is deleted with the
  deviation; `parity:api:calls` gains no baseline row.
- activemodel and all three ActiveRecord adapter lanes stay green.
