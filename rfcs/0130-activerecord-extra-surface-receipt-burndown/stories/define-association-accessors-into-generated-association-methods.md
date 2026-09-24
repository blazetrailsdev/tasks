---
title: "define-association-accessors-into-generated-association-methods"
status: claimed
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 9
pr: null
claim: "2026-09-24T16:13:07Z"
assignee: "converge-invented-association-scope-and-key-helpers"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/core.ts` `generatedAssociationMethods` now builds and
includes a `Module` (`core.rb:338-346`), but association readers/writers are not
defined into it. Rails defines them there: `associations/builder/association.rb:96,147`
(`mixin = model.generated_association_methods`), `builder/singular_association.rb:13`,
`builder/belongs_to.rb:145`, `nested_attributes.rb:387`. In trails they are
defined elsewhere, so the module stays empty and an association accessor cannot be
overridden in the class body with `super` reaching the generated one.

## Acceptance criteria

- The association builders' `define_readers` / `define_writers` (and the
  singular `build_`/`create_` methods, belongs_to `_changed?`, nested attributes
  `_attributes=`) define into `generatedAssociationMethods()` via `defineMethod`
  / `moduleEval`, mirroring the Rails `mixin.class_eval` sites.
- A class-body override of an association reader can reach the generated one
  through the module's `superMethod`.
