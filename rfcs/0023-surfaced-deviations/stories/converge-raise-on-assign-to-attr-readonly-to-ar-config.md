---
title: "Converge raiseOnAssignToAttrReadonly module-local to canonical ar-config binding"
status: done
updated: 2026-06-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 4117
claim: "2026-06-25T12:29:32Z"
assignee: "converge-raise-on-assign-to-attr-readonly-to-ar-config"
blocked-by: null
---

## Context

Follow-up surfaced while converging duplicate AR module-config homes in PR #4106
(converge-ar-module-config-duplicate-homes-to-canonical). That PR forwarded the
4 flags that have canonical `ar-config.ts` bindings into the module via a new
`active_record.set_configs` initializer (trailtie.ts), mirroring Rails'
`railtie.rb` copy loop.

`raiseOnAssignToAttrReadonly` was NOT included because it has no `ar-config.ts`
binding — it lives as a module-local `_raiseOnAssignToAttrReadonly` in
`readonly-attributes.ts:23` (read at :139/:162), with a parallel staging copy
in the trailtie `ActiveRecordConfig` object (trailtie.ts:114,131). Rails keeps
it as a module-level singleton accessor:
`ActiveRecord.raise_on_assign_to_attr_readonly` (active_record.rb:342-343,
default false). This is the same "duplicate home" deviation class the parent
story converged for errorOnIgnoredOrder / belongsToRequiredValidatesForeignKey /
applicationRecordClass.

Converge: add `raiseOnAssignToAttrReadonly` + `setRaiseOnAssignToAttrReadonly`
to `ar-config.ts` (default false, matching active_record.rb:343), rewire the two
consult sites in `readonly-attributes.ts` to read the binding, drop the
module-local `_raiseOnAssignToAttrReadonly`, and forward the trailtie config
into it from the existing `active_record.set_configs` initializer.

NOTE: `hasManyInversing` does NOT need this treatment — Rails exposes it as
`ActiveRecord::Base.has_many_inversing` (a Base class_attribute), and trails
already mirrors it as a Base static (base.ts:824). That is Rails-faithful; leave
it.

## Acceptance criteria

- `ar-config.ts` exports `raiseOnAssignToAttrReadonly` + setter (default false,
  active_record.rb:343).
- `readonly-attributes.ts` reads the canonical binding at both consult sites;
  module-local `_raiseOnAssignToAttrReadonly` removed.
- `active_record.set_configs` (trailtie.ts) forwards
  `cfg.raiseOnAssignToAttrReadonly` into the module setter.
- No behavior change (default false already matches); api:compare and
  test:compare delta >= 0.
