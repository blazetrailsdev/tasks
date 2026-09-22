---
title: "Converge rbObjSingletonClass for class receivers and port ClassAttribute's attached-module arm"
status: draft
updated: 2026-09-22
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#7955 ported `Kernel#singleton_class` as `rbObjSingletonClass` (`packages/ruby-compat/src/object.ts`) for instance receivers only. A class receiver raises `TypeError`, where Ruby gives it a metaclass (`vendor/ruby/class.c:2240`, documented as supported at `vendor/ruby/object.c:275-284`). Because of that, `ClassAttribute.redefine` (`packages/activesupport/src/class-attribute.ts`) does not port Rails' `owner.attached_object.is_a?(Module)` arm (`activesupport/lib/active_support/class_attribute.rb:8-9`), and `Class#attached_object` (`class.c:1707-1714`) has no port. Rails exercises the arm in `activesupport/test/core_ext/class/attribute_test.rb:119-143` ("when defined in a class's singleton", "works well with module singleton classes").

## Acceptance criteria

- Class receivers get a singleton-class representation: a distinct marked object for which `rbModSingletonP` is true and an `rbClassAttachedObject` port returns the class. It can be a static-side proxy class or similar, but statics must stay readable through it.
- `ClassAttribute.redefine` ports the `attached_object.is_a?(Module)` arm.
- The two Rails tests above are ported with verbatim names.
- The CLAUDE.md "`singleton_class` is a per-object subclass" limitation paragraph is removed.
