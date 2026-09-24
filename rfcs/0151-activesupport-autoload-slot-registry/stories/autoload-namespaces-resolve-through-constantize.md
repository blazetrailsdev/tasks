---
title: "Autoload namespaces resolve through constantize (ActiveRecord, ActiveRecord::Migration)"
status: draft
updated: 2026-09-24
rfc: "0151-activesupport-autoload-slot-registry"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8031. `fullTableNamePrefix` / `fullTableNameSuffix`
(`packages/activerecord/src/model-schema.ts`) now port
`module_parents.detect { |p| p.respond_to?(:table_name_prefix) }`
(`activerecord/lib/active_record/model_schema.rb:302-308`) through activesupport's
`moduleParents` (`packages/activesupport/src/module-ext.ts`, the port of
`activesupport/lib/active_support/core_ext/module/introspection.rb:53-64`), which
`constantize`s every enclosing name through the `registerConstant` table
(`packages/activesupport/src/inflector.ts`).

The framework namespaces are not in that table. `constantize("ActiveRecord")` and
`constantize("ActiveRecord::Migration")` raise `NameError`, although in Ruby they
always resolve. A model named `ActiveRecord::Migration::UniqueConstraintTest::Section`
(Rails nests it that way at `activerecord/test/cases/migration/unique_constraint_test.rb:7-12`,
and the same for `exclusion_constraint_test.rb`) therefore raised from
`module_parents`. trails#8031 papered over this in the two test files by registering
`ActiveRecord` / `ActiveRecord::Migration` by hand
(`packages/activerecord/src/migration/unique-constraint.test.ts`,
`exclusion-constraint.test.ts`).

The `Autoload` namespace objects (`packages/activerecord/src/namespaces.ts`,
`arel/src/namespaces.ts`, `activesupport/src/namespaces.ts`, …) are the Ruby
constants `ActiveRecord`, `ActiveRecord::Associations`, `Arel::Nodes`, … and their
seated members (`ActiveRecord.Base`, `ActiveRecord.Migration`, …) are the nested
constants.

## Acceptance criteria

- `constantize("ActiveRecord")`, `constantize("ActiveRecord::Migration")` and
  `constantize("ActiveRecord::Base")` resolve to the namespace object / seated class,
  as Ruby's constant table does. The namespace or `autoload` seat registers
  itself, so there is no per-call-site registration.
- The hand registrations of `ActiveRecord` / `ActiveRecord::Migration` in
  `unique-constraint.test.ts` / `exclusion-constraint.test.ts` are deleted (the
  enclosing `…ConstraintTest` module registration stays, since that constant is
  test-defined).
