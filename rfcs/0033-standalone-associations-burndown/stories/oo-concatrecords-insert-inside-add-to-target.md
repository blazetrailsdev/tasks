---
title: "OO concatRecords should run insert_record inside the add_to_target block, matching Rails' ordering"
status: ready
updated: 2026-06-30
rfc: "0033-standalone-associations-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`CollectionAssociation#concatRecords`
(packages/activerecord/src/associations/collection-association.ts, in the
`concatRecordsLoop` callback) runs `addToTarget(record)` **first** and then calls
`insertRecord(record)` afterward. Rails runs `insert_record` **inside** the
`add_to_target(record) { ... }` block (vendor/rails/.../collection_association.rb:440-446),
so the ordering is: before_add → set_inverse_instance → yield(insert_record) →
target mutation → after_add (replace_on_target, collection_association.rb:457-483).

trails' OO path therefore fires after*add and commits the record to the target
\_before* the DB insert, inverting Rails' sequence. The runtime
`CollectionProxy#push` path is already faithful — it passes the insert as the
`save` callback to `_addToTarget`, which runs it inside the replace_on_target
funnel (insert between set_inverse_instance and the target mutation). This story
converges the OO `concatRecords` to the same in-block ordering so the OO parity
surface matches Rails and the runtime path.

Surfaced while merging PR #4308 (collection-proxy-push-delegate-to-association-concat),
which unified the result/Rollback loop but deliberately preserved each layer's
existing add/insert ordering to stay behavior-neutral.

## Acceptance criteria

- OO `CollectionAssociation#concatRecords` performs the per-record insert inside
  the `addToTarget` funnel (mirroring Rails' `add_to_target(record) { insert_record }`),
  so before_add → insert → target-mutation → after_add ordering holds.
- No behavior change for the runtime push path; existing has-many / through /
  habtm concat + replace/writer tests stay green.
