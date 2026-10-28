---
title: "Delete registerConstant and the top-level constant table"
status: ready
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: retire
packages: ["ruby-compat", "activesupport"]
deps:
  [
    "constant-lookup-helpers-keep-only-rails-const-get-sites",
    "framework-register-constant-seats-retire-onto-class-path-tables",
    "ruby-compat-core-classes-join-a-generated-class-path-table",
    "test-suites-drop-register-model-and-register-constant",
    "module-eval-namespace-reads-converge-to-imports",
    "gate-rb-mod-const-set-to-rails-const-set-sites",
  ]
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

This is the finish line for constant lookup. After the sweeps, the literal-lookup story,
the framework, core, application and test seat stories, and the
module-eval survivors story, nothing should write the top-level constant
table or read it outside a ported Rails lookup. Then these can go:

- `registerConstant` / `unregisterConstant` / `resetConstants`
  (`packages/ruby-compat/src/variable.ts:74-166`)
- `isRegisteredConstant` / `registeredConstant`
- `RCLASS_CONST_TBL` (`packages/ruby-compat/src/object.ts:145`), with
  `rbConstGet(Object, ...)`, `rbPathToClass` and `constantize`
  (`packages/activesupport/src/inflector.ts:194-224`) resolving through the
  generated class-path tables only
- the `classpaths` WeakMap's seat-written entries, leaving `rbModName`
  answering from the generated table or `rbModConstSet`
- `rbFBinding`'s fallback to the constant table (`variable.ts:139-153`)

## Acceptance criteria

- [ ] The names above are deleted, with their exports, from ruby-compat's
      `index.ts`.
- [ ] `constantize` and `rbPathToClass` resolve a name through the explicit
      registries only (the generated class-path tables and the application
      table), with no `isRegisteredConstant` arm and no `const_get` walk over
      namespace properties (owner ruling, 2026-10-28). `rbModConstGet` and
      `rbConstGet` are deleted with the table.
- [ ] The gate from `gate-rb-mod-const-set-to-rails-const-set-sites` reports
      zero `registerConstant` calls and is narrowed to forbid the name.
- [ ] `pnpm parity:modules` and `parity:api:extra:gate` for ruby-compat are
      tightened where the deletions lowered them.
