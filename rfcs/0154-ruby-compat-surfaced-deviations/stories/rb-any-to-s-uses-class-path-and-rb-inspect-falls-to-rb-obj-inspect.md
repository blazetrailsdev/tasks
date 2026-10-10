---
title: "ruby-compat: rbAnyToS names the class by rb_class_name; rbInspect of a plain instance is rb_obj_inspect"
status: draft
updated: 2026-10-10
rfc: "0154-ruby-compat-surfaced-deviations"
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

Surfaced by trails#8748, which ported `Type::Serialized#inspect`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/type/serialized.rb:33`,
`define_method(:inspect, Kernel.instance_method(:inspect))`) as `rbObjInspect(this)`.
`new Serialized(new StringType(), coder).inspect()` prints

    #<Serialized:0x00007f0000000008 @delegate_dc_obj=[object Object], @subtype=[object Object], @coder={…}>

where Ruby prints `#<ActiveRecord::Type::Serialized:0x… @delegate_dc_obj=#<ActiveModel::Type::String:0x… @true=…>, …>`.
Two ruby-compat causes, both in `packages/ruby-compat/src/object.ts`:

1. `rbAnyToS` (`:1095-1098`) names the class with `obj.constructor.name`. MRI's `rb_any_to_s`
   (`vendor/ruby/v3.3.11/object.c:693-701`) uses `rb_class_name(CLASS_OF(obj))`, the full constant path.
   `Serialized` IS registered (`registerConstant("ActiveRecord::Type::Serialized", Serialized)`,
   `packages/activerecord/src/type/serialized.ts:88`) and `rbModName` (`object.ts:363`) answers the path;
   `rbAnyToS` just does not ask it. `rbObjInspect` (`:1066`) inherits the short name through `rbAnyToS`.
2. `rbInspect` / `inspectValue` (`:1187-1211`) falls through to `String(value)` for a class instance with
   no `inspect`, giving `[object Object]`. MRI's `rb_inspect` (`object.c:704`) sends `inspect`, and an
   object that defines none gets `Kernel#inspect` = `rb_obj_inspect` (`object.c:783-795`). `rbInspect`'s
   own JSDoc records the gap ("a caller that does pass a class instance gets its `to_s`").

`packages/activerecord/src/type/serialized.trails.test.ts` ("Serialized#inspect") currently accepts either
class spelling because of (1).

## Acceptance criteria

- [ ] `rbAnyToS` names the class as `rb_class_name` does (the registered constant path via `rbModName`, the bare name only for an unregistered/anonymous class).
- [ ] `rbInspect` of a class instance with no `inspect` answers `rbObjInspect(value)`, recursion-guarded as `rb_obj_inspect` is.
- [ ] The `Serialized#inspect` trails test asserts `#<ActiveRecord::Type::Serialized:0x…` only, and no `[object Object]` in the output.
- [ ] Callers whose output changes (grep `rbAnyToS(`, `rbObjInspect(`) are checked against the Rails string they mirror.
