---
title: "activerecord: Inheritance's find_sti_class call rows (discriminate_class_for_record, subclass_from_attributes)"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: calls-args
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two reviewed rows in `call-mismatches-exclude/activerecord/inheritance.json`:

- `discriminate_class_for_record` omits `find_sti_class` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:301`) — trails routes
  through `findStiClassForRow`, "the registry-safe variant".
- **args** `subclass_from_attributes` → `find_sti_class(subclass_name)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:337`) —
  trails' `inheritance.ts` renders the module's class methods as free functions, so the receiver moves
  into the argument list.

`findStiClassForRow` is extra surface with no Rails counterpart; the class-methods-as-free-functions
shape is what CLAUDE.md § "Module mixins" replaces with `this`-typed functions assigned to the class.
The CONVERGEABLE prose receipts in the same file are `activerecord-converge-inheritance-convergeable-receipts`.

## Acceptance criteria

- [ ] `discriminateClassForRecord` calls `findStiClass(record[inheritanceColumn])` as Rails does; `findStiClassForRow` is deleted.
- [ ] `subclassFromAttributes` calls `this.findStiClass(subclassName)` on the class.
- [ ] Both rows deleted; `inheritance.ts` shard removed; STI tests green on all adapters.
