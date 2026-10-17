---
title: "Generated singleton_class.public_instance_methods without the shim"
status: draft
updated: 2026-10-17
rfc: "0185-ruby-ts-codegen"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The codegen generator lowers `klass.singleton_class.public_instance_methods(false)` and its relatives through a generated-runtime shim, `rbSingletonPublicMethods` (`scripts/codegen/src/runtime-shim.ts`). It maps `class_attribute` storage names back to their readers. The repo owner ruled that no generated runtime ships.

The Ruby sources are:

- `Object#singleton_methods` is `rb_obj_singleton_methods` (`vendor/ruby/v3.3.11/class.c:2081`);
- `Object#public_methods` is `rb_obj_public_methods` (`class.c:2042`), which ruby-compat already ports as `rbObjPublicMethods` (`packages/ruby-compat/src/method.ts`).

The class-attribute name mapping belongs beside activesupport's `classAttribute` storage (`__class_attr_<name>`), not in a generated runtime.

## Acceptance criteria

- [ ] ruby-compat ports `rb_obj_singleton_methods` with the `class.c` citation and tests, or the generator reaches the existing `rbObjPublicMethods` with a singleton receiver if that answers the same.
- [ ] Mapping `__class_attr_<name>` storage back to `<name>` lives in activesupport's class-attribute code, or in the ruby-compat port when it is told the storage prefix.
- [ ] `rbSingletonPublicMethods` is deleted from `runtime-shim.ts`.
