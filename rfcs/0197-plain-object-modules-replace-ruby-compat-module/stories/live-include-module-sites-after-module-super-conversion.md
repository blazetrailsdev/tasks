---
title: "live-include-module-sites-after-module-super-conversion"
status: blocked
updated: 2026-10-21
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: null
packages: []
deps:
  - activemodel-activesupport-module-super-inlined-into-includers
  - activerecord-module-super-and-live-include-sites
deps-rfc: []
est-loc: null
priority: 9
pr: null
claim: "2026-10-21T20:14:55Z"
assignee: "module-count-ratchet-blocks-new-ruby-compat-modules"
blocked-by: "waiting on a repo-owner ruling for live includes (methods defined on a module after a class includes it); the AC requires each site to convert under that ruling, which does not exist yet"
closed-reason: null
---

## Context

The module-super conversion (stories `activemodel-activesupport-module-super-inlined-into-includers`
and `activerecord-module-super-and-live-include-sites`) left every remaining `new Module` in
activemodel / activesupport / activerecord on a live include: methods are defined on the
module after a class includes it, or a module's `super` reaches such a module. Root CLAUDE.md
§ "A Ruby module is a plain object or a class module" leaves each of these "on a `Module` until
its own story settles it". Sites at the time of writing:

- `activemodel/src/attribute-methods.ts:358` and `activesupport/src/current-attributes.ts:227`
  `generatedAttributeMethods` (`attribute_methods.rb`, `current_attributes.rb`); tracked by
  `generated-attribute-methods-without-live-include`.
- `activerecord/src/attribute-methods.ts:174` `GeneratedAttributeMethods`
  (`attribute_methods.rb:42-50`), `core.ts:681` `generatedAssociationMethods` (`core.rb:442`),
  `relation/delegation.ts:119` `GeneratedRelationMethods` (`relation/delegation.rb:57`).
- `activerecord/src/enum.ts:130` `EnumMethods` (`enum.rb`); see `enum-methods-module-carrier-overridable`.
- `activerecord/src/store.ts:53` `_storeAccessorsModule` (`store.rb:211-217`); see
  `converge-store-accessors-module-include`.
- `activerecord/src/marshalling.ts:54` `Methods`: `format_version=` aliases / removes
  `marshal_dump` after `Base` includes it (`marshalling.rb:6-16`).
- `activerecord/src/encryption/encryptable-record.ts:80` `override_accessors_to_preserve_original`
  (`encryptable_record.rb:109-127`): its accessors' `super` reaches the generated attribute
  accessors, which are defined after the include, so `rbCallSuper`'s include-time snapshot
  misses them (tried; the `ignore_case` tests in `encryptable_record_test.rb` go red). See
  `encryption-preserve-original-accessors-call-super`.

The `instanceof Module` checks in activesupport (`class-attribute.ts`, `delegation.ts`,
`code-generator.ts`, `module-ext.ts`, `rescuable.ts`) stay while any `Module` exists.

## Acceptance criteria

- Each site above is converted under a repo-owner ruling for live includes (no carrier, no
  includer list), or closed by the story already named for it.
- No `new Module` / `superMethod` remains in activemodel, activesupport or activerecord.
