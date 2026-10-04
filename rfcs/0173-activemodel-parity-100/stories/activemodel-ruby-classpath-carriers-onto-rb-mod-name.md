---
title: "activemodel: Attribute's [rubyNamespace] statics and Model.moduleName read the classpath from rb_mod_name"
status: in-progress
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel", "ruby-compat"]
deps:
  - model-namespace-reads-the-constant-path-not-a-module-name-static
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8488
claim: "2026-10-04T16:09:34Z"
assignee: "activemodel-ruby-classpath-carriers-onto-rb-mod-name"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activemodel-audit-permanent-receipts-root`. Seven `@noRailsEquivalent` receipts in
activemodel exist because a JS class's `name` is unqualified, where Ruby's `Module#name`
(`vendor/ruby/v3.3.11/variable.c:122` `rb_mod_name`) is the classpath `const_set` gave it:

- `packages/activemodel/src/attribute.ts` — `static readonly [rubyNamespace]` on `Attribute`
  (`"ActiveModel"`) and on `FromDatabase`, `FromUser`, `WithCastValue`, `Null`, `Uninitialized`
  (`"ActiveModel::Attribute"`; `vendor/rails/v8.0.2/activemodel/lib/active_model/attribute.rb:6,173,197,212,222,242`).
  The only reader is arel's visitor dispatch (`packages/arel/src/visitors/ruby-class.ts`
  `rubyConstantName`, for `visit_ActiveModel_Attribute`,
  `vendor/rails/v8.0.2/activerecord/lib/arel/visitors/to_sql.rb:756`), which
  `arel-visitor-class-names-onto-ruby-compat` (RFC 0172) moves onto ruby-compat.
- `packages/activemodel/src/model.ts` — `declare static moduleName?: string`, the `::`-joined
  module path `ModelName` reads where Rails reads `klass.name`
  (`vendor/rails/v8.0.2/activemodel/lib/active_model/naming.rb:166-167`) and `module_parents`
  (`naming.rb:271-275`).

No CLAUDE.md section ratifies either carrier. ruby-compat already holds the classpath a `const_set`
gives a module (`classpaths`, `packages/ruby-compat/src/include.ts:115` `Module#name`), and the
activemodel classes are already seated on the `ActiveModel` Autoload namespace
(`packages/activemodel/src/namespaces.ts`). `error-inspect-renders-receiver-class-name` (this RFC)
needs the same derivation for `self.class.name`.

## Acceptance criteria

- [ ] The six `[rubyNamespace]` statics are deleted; the classpath is read from the namespace seat through ruby-compat's `rb_mod_name` port.
- [ ] `Model.moduleName` is deleted or read from the same classpath; `ModelName`'s constructor reads `klass.name` as `naming.rb:167` does.
- [ ] `pnpm parity:api:extra --package activemodel` drops by the seven names; arel's `visit_ActiveModel_Attribute` dispatch stays green.

## Verification

```bash
pnpm parity:api:extra --package activemodel && pnpm vitest run packages/activemodel/src/naming.test.ts packages/arel/src/visitors
```
