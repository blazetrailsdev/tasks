---
title: "activerecord: Base's inherited chain needs one deferred dispatch, decided in CLAUDE.md"
status: done
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8718
claim: "2026-10-09T17:09:43Z"
assignee: "active-record-base-inherited-chain-needs-one-deferred-dispatch"
blocked-by: null
closed-reason: null
---

## Context

`core-inherited-seeding-leaves-the-generated-modules-and-find-by-cache-readers` cannot converge on its own. Its two readers (`generatedAssociationMethods`, `cachedFindByStatement`, `packages/activerecord/src/core.ts`) take Rails' shape only if something runs `Core::ClassMethods#inherited` (`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:412-430`) for a subclass before its first use, and JS has no hook when a subclass is defined.

A first attempt shipped in trails#8626 and was backed out in review. It ported `inherited` in `core.ts` and fired it from accessor properties installed on `Base` for `_findByStatementCache` and `_generatedAssociationMethods` (the shape `ParamsWrapper`'s `deferInherited` uses, `packages/actionpack/src/action-controller/metal/params-wrapper.ts`). What it measured:

- The trigger is new `@noRailsEquivalent PERMANENT` surface with no CLAUDE.md section behind it. § "`inherited` is deferred to own-property memo guards" covers `ModelSchema` and `ParamsWrapper` only.
- `inherited` is one link of a chain. Nine modules define it under `ActiveRecord::Base`: `core.rb:412`, `attribute_methods.rb:265`, `attribute_methods/primary_key.rb:143`, `persistence.rb:301`, `inheritance.rb:287`, `model_schema.rb:574`, `reflection.rb:142`, `locking/optimistic.rb:194`, plus ActiveModel's. A trigger that runs only Core's link has to fold `AttributeMethods`' link (`child_class.initialize_generated_modules`, then `@alias_attributes_mass_generated = false; @attribute_names = nil`) into it or drop it.
- Core's `class_eval` block (`@arel_table = nil`, `@predicate_builder = nil`, `@inspection_filter = nil`, `@filter_attributes ||= nil`, `@generated_association_methods ||= nil`) is only safe to port if the trigger fires before any of those memos is built, which means every one of those ivars is a trigger and their readers (`arelTable`, `predicateBuilder`, `inspectionFilter`, `filterAttributes`) drop their `Object.hasOwn` guards.
- Order: a leaf class read before its parent ran `inherited` with the parent as `self` before the parent's own `inherited` had run. Rails runs each once, in definition order, so the trigger must run the superclass chain first.
- `attribute-methods.ts` keeps its own `if (!hasOwn(_generatedAttributeMethods)) initializeGeneratedModules()` guards (`aliasAttribute`, `defineAttributeMethods`, `undefineAttributeMethods`, `encryption/encryptable-record.ts`). With both mechanisms live, a class first touched through one of those ran `initializeGeneratedModules` twice. Those guards are `attribute-methods-initialize-generated-modules-deferral-guards`, and `converge-attribute-registration-inherited-hook-and-decorator-replay` is a third story on the same missing hook.

## Decision needed

One mechanism for `ActiveRecord::Base`'s `inherited` chain, decided once by the repo owner and recorded in CLAUDE.md § "`inherited` is deferred to own-property memo guards": either a single first-read dispatch on `Base` that runs every module's ported `inherited` link in Rails' order (superclass chain first), or the own-property memo guard extended to these ivars.

## Acceptance criteria

- [ ] CLAUDE.md records the mechanism for `Core`, `AttributeMethods` and the other `inherited` definers listed above.
- [ ] The three dependent stories are re-specified against it: `core-inherited-seeding-leaves-the-generated-modules-and-find-by-cache-readers`, `attribute-methods-initialize-generated-modules-deferral-guards`, `converge-attribute-registration-inherited-hook-and-decorator-replay`.
- [ ] A test covers a three-level hierarchy whose leaf is touched before its parent.
