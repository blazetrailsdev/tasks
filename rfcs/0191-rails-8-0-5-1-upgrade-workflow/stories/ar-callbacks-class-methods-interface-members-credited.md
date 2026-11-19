---
title: "ActiveRecord::Callbacks' 15 model-callback macros are credited again after the ClassMethods interface/const merge"
status: done
updated: 2026-11-19
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: ["activerecord", "scripts"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10364
claim: "2026-11-19T17:27:07Z"
assignee: "ar-callbacks-class-methods-interface-members-credited"
blocked-by: null
closed-reason: null
---

## Context

Re-measured for `entry-check-data-layer-parity-is-closed-on-8-0-2` on trails
`aecc5821aa` (2026-11-19): activerecord is 6951/6966 methods, all 15 missing
in `callbacks.rb` (`after_initialize`, `after_find`, `after_touch`,
`before_save`, `around_save`, … `ActiveRecord::Callbacks`), i.e. the macros
`define_model_callbacks` generates
(`vendor/rails/v8.0.2/activerecord/lib/active_record/callbacks.rb`).
On 2026-11-11 (`876804dd8b`) they were credited (6987/6991).

The only change to `packages/activerecord/lib/callbacks.ts` since then is
trails#10064 (`39529dd530`), which turned `export declare class ClassMethods`
into `export interface ClassMethods { afterInitialize: …; … }` plus
`export const ClassMethods = {}; include(ClassMethods, ActiveModelCallbacks);`
(`callbacks.ts:30-168`). The extractor now reads the empty const as the
module and no longer credits the members declared on the merged interface.

## Acceptance criteria

- [ ] The 15 `ActiveRecord::Callbacks` macros are matched again by
      `API_COMPARE_FORCE=1 pnpm parity:api` (activerecord back to 0 missing
      in `callbacks.rb`), without reverting #10064's seat.
- [ ] Decide where the fix lives: either the extractor credits a merged
      same-named interface's members onto the plain-object module, or
      `callbacks.ts` takes a shape the extractor already credits. Prefer the
      fix that also covers the other #10064 "plain-object module, merged with
      the same-named host interface" sites; check each for the same drop.
- [ ] A scripts test pins the crediting.
