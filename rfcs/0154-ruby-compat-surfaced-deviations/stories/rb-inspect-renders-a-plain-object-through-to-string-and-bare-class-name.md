---
title: "ruby-compat: rbInspect renders an object with no inspect as [object Object]; rbAnyToS prints the bare JS class name"
status: draft
updated: 2026-10-11
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

Surfaced on trails#8786. Ruby's `Kernel#inspect` (`rb_obj_inspect`, `vendor/ruby/v3.3.11/object.c`)
renders an object that defines neither `inspect` nor `to_s` as `#<Namespace::Class:0x… @ivar=…>`,
with the full `Module#name`.

ruby-compat's `rbInspect` (`packages/ruby-compat/src/object.ts`, `inspectValue`) sends a plain class
instance through `rbObjAsString`, whose object arm answers `value.toString()`. For a class with no
`toS` and no `toString` override that is `"[object Object]"`, so `rbObjInspect` is never reached.
`rbAnyToS` (same file) builds the `#<Class:0x…>` head from `obj.constructor.name`, the bare JS class
name, where Ruby prints `rb_class_name` (`ActiveRecord::ConnectionAdapters::NullPool`).

Observed with `rbInspect(new NullPool())` answering `[object Object]`;
`packages/activerecord/src/connection-pool.trails.test.ts` ("raises NoMethodError for every send it
has no method for") had to assert `rbObjInspect(pool)` against `#<NullPool:0x…` instead.

## Acceptance criteria

- [ ] `rbInspect` of an object with no `inspect` / `toS` of its own answers `rb_obj_inspect`'s
      rendering, not `Object.prototype.toString`'s.
- [ ] `rbAnyToS` prints the class through `rbModName` / `rbObjClassname`, so a namespaced class
      renders with its namespace.
- [ ] The NullPool test asserts `rbInspect(pool)` matches
      `/^#<ActiveRecord::ConnectionAdapters::NullPool:0x/`.
