---
title: "activerecord: port Enum#_enum line for line and move conflict detection into define_enum_methods"
status: done
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps:
  - enum-type-reads-mapping-key-and-has-value-with-no-reverse-map
deps-rfc: []
est-loc: 450
priority: null
pr: trails#8742
claim: "2026-10-10T02:09:38Z"
assignee: "enum-private-enum-body-is-a-line-for-line-port"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-root-a-f-part-3`, which converged every other row in its
list and left this one because the rewrite does not fit beside them under the PR ceiling.

`pnpm parity:api:arms:report --package=activerecord --direction=invented` still shows one row in `enum.ts`:

- `enum.ts#_enum` — `-loop -loop` and 28 `+if`

Rails' `_enum` is `vendor/rails/v8.0.2/activerecord/lib/active_record/enum.rb:221-287`; its arms are the two guards
in the `decorate_attributes` block (`:240-248`), the `prefix` / `suffix` pairs (`:253-259`), the
`values.respond_to?(:each_pair) ? values.each_pair : values.each_with_index` ternary and the `pairs.each` loop
(`:261-262`, the three iterations the report reads as `-loop -loop` against the port's one `for … of`), the alias
guard (`:273`), `if scopes` (`:279`), and `if validate` with its `Hash === validate` (`:281-284`).

The port (`packages/activerecord/src/enum.ts`, `_enum`) is a rewrite rather than a translation:

- It builds a plain `mapping` object and stores it in `this._enums` (a `Map`, `base.ts:1072`, read by
  `fixture-set/table-row.ts:176-181`) where Rails builds one `ActiveSupport::HashWithIndifferentAccess`, defines the
  plural reader over it and assigns `defined_enums[name]` (`enum.rb:226-233`), then freezes it (`:286`).
- It derives `prefixStr` / `suffixStr` and a four-arm `methodName` closure where Rails rebinds `prefix` / `suffix`
  to `"#{name}_"` / `"_#{name}"` strings and interpolates (`:253-265`).
- It hand-rolls conflict detection in the loop body (`definedNames`, `dangerousMethods`, `_enumMethodsModuleNames`,
  about twenty `raiseConflictError` guards) where Rails calls `klass.send(:detect_enum_conflict!, …)` four times
  inside `EnumMethods#define_enum_methods` (`:303-322`). `detectEnumConflictBang` in turn lacks Rails' fifth arm,
  `!klass_method && method_defined_within?(method_name, _enum_methods_module, Module)` (`:378-379`), which is what
  those hand-rolled sets stand in for. `enum-detect-conflict-for-accessor-names` and
  `enum-friendly-alias-intra-enum-conflict` touch the same code.
- It adds a `moduleEval` block defining `is${originalName}` / `${originalName}Bang` for labels with non-word
  characters, which Rails has no counterpart for (the alias at `:270-276` is the Rails mechanism).
- It defines the attribute accessor with `Object.defineProperty(this.prototype, name, …)` and branches on
  `"default" in options` where Rails calls `attribute(name, **options)` (`:238`).

## Acceptance criteria

- [ ] `_enum` is a line-for-line port of `enum.rb:221-287`: one `HashWithIndifferentAccess` named `enumValues`,
      filled inside the loop and frozen at the end; Rails' locals (`valueMethodNames`, `pairs`, `label`,
      `valueMethodName`, `methodFriendlyLabel`, `valueMethodAlias`); the `prefix` / `suffix` rebinding; the
      `eachPair` / `eachWithIndex` ternary.
- [ ] `EnumMethods#defineEnumMethods` makes Rails' four `detect_enum_conflict!` calls (`enum.rb:306,310,316,320`),
      and `detectEnumConflictBang` is Rails' five-arm `if` / `elsif` chain (`:369-381`), with the hand-rolled
      conflict sets deleted.
- [ ] `this._enums` is gone: `defined_enums` is the one store, and `fixture-set/table-row.ts` reads it.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented` shows no `enum.ts#_enum` row.
- [ ] `enum.test.ts`, `enum.trails.test.ts` and `enum-cold-schema.trails.test.ts` pass.
