---
title: "base-inspect-singleton-class-arm"
status: in-progress
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8114
claim: "2026-09-25T22:17:02Z"
assignee: "base-inspect-singleton-class-arm"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Core::ClassMethods#inspect`
(`vendor/rails/activerecord/lib/active_record/core.rb:375-388`) opens with
`if self == Base || singleton_class?` and returns `super`. trails' `Base.inspect`
(`packages/activerecord/src/base.ts`, `static inspect()`) ports only the
`self == Base` half; a singleton class from `rbObjSingletonClass` falls through
to the schema arms.

The `super` for a singleton class is `Module#inspect` = `rb_mod_to_s`
(`vendor/ruby/object.c:1710-1728`), which renders `#<Class:` plus the attached
object's `rb_inspect` (class/module) or `rb_any_to_s` (instance), then `>`.
ruby-compat has no `rb_mod_to_s` port, and `rbObjSingletonClass`'s subclass is
named `klass`, so adding the guard alone would return the wrong string.

## Acceptance criteria

- ruby-compat ports `rb_mod_to_s` (singleton arm reading the attached object
  `rbObjSingletonClass` records under `FL_SINGLETON`).
- `Base.inspect` carries the `singleton_class?` guard (`rbModSingletonP`) and
  returns that port's string for a singleton class.
- A test covers `rbObjSingletonClass(record).inspect()`.
