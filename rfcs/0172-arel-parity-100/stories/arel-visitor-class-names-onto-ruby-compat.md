---
title: "arel: resolve object.class / Module#name through ruby-compat, delete ruby-class.ts and temporal-tag.ts"
status: in-progress
updated: 2026-10-01
rfc: "0172-arel-parity-100"
cluster: receipts
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8320
claim: "2026-10-01T12:17:34Z"
assignee: "arel-visitor-class-names-onto-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

Split out of `arel-audit-permanent-receipts-against-claude-md`. Rails' visitor
dispatches on `object.class` and names it with `Module#name`
(`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/visitor.rb:17-41`:
`:"visit_#{(klass.name || "").gsub("::", "_")}"`, `object.class.ancestors`), and
`visitors/dot.rb:253` renders `o.class.name`.

arel emulates `obj.class.name` with its own helpers, which have no Rails
counterpart and are only receipted, not ratified by any CLAUDE.md section:

- `packages/arel/src/visitors/ruby-class.ts` — `setRubyNamespace` (`:6`),
  `rubyConstantName` (`:11`), `rubyClassName`, `isHashAnalogue`, and the private
  `dateTimeClassName`; the file-level receipt at `:1` covers the last three.
- `packages/arel/src/temporal-tag.ts` — `temporalClassName` (Temporal → Ruby
  `Date` / `DateTime` / `Time`). Its `temporalTag` already converged onto
  ruby-compat's.

ruby-compat already has the Ruby-core half: `rbObjClass`
(`packages/ruby-compat/src/object.ts:20`, `rb_obj_class`) and the `rubyClass`
brand (`comparable.ts:31`). The emulation belongs there, as `Module#name` /
`rb_obj_class` ports carrying ruby-compat's `@noRailsEquivalent PERMANENT`
inventory receipts, and arel's visitors call them at the `object.class` /
`klass.name` sites.

## Acceptance criteria

- [ ] `visitors/visitor.ts` and `visitors/dot.ts` resolve `object.class` /
      `klass.name` through ruby-compat (`rbObjClass` or a `Module#name` port
      there), with `Arel::Nodes::…` nesting still rendered.
- [ ] `visitors/ruby-class.ts` and `temporal-tag.ts` are deleted from arel, with
      their receipts.
- [ ] `pnpm parity:api:extra:gate` green (arel `novel` 0, ruby-compat growth
      receipted); `pnpm vitest run packages/arel/src/visitors` green.
