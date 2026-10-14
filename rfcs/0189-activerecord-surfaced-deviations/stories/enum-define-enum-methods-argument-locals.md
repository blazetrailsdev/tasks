---
title: "_enum passes renamed locals to defineEnumMethods"
status: closed
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages:
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "rfc-refine 0189 (2026-10-14, trails origin/main 03da862b8a): Landed: origin/main enum.ts:268-292 calls defineEnumMethods(name, valueMethodName, ...) and (name, valueMethodAlias, ...), Rails' locals at enum.rb:268,275; the attrName/fullName/friendlyName spelling is gone."
---

## Context

Surfaced by the RFC 0096 wave-2 burndown (PR #6386), which left two `naming`
rows on `enum.ts#_enum` → `defineEnumMethods` standing because neither could
be renamed in isolation.

Rails (`activerecord/lib/active_record/enum.rb:268` and `:275`):

```ruby
define_enum_methods(name, value_method_name, value, scopes, instance_methods)
...
define_enum_methods(name, value_method_alias, value, scopes, instance_methods)
```

trails (`packages/activerecord/src/enum.ts`, `_enum`) passes
`attrName, fullName, value, scopesEnabled, instanceMethodsEnabled` and
`attrName, friendlyName, value, scopesEnabled, instanceMethodsEnabled`.

Two separate problems, which is why #6386 left both rows:

1. **`attrName` is not Rails' `name`.** trails resolves the enum name through
   `_attributeAliases` before this point and passes the RESOLVED column, where
   Rails passes the declared `name` (enum.rb:268 — the alias resolution happens
   in `decorate_attributes([name])`, enum.rb:238, not at the method-definition
   call). If the port genuinely needs the resolved column here, that is a
   behavioral divergence to justify at the call site with a Rails cite; if not,
   pass `name`.

2. **`scopesEnabled` / `instanceMethodsEnabled` cannot take the Rails names**
   as the body stands, because `options.scopes` and `options.instanceMethods`
   are read in the same scope and a bare `scopes` / `instanceMethods` local
   would shadow-confuse them. Rails binds them once at the top
   (`scopes` / `instance_methods` are the kwargs themselves). Converging means
   destructuring the options into Rails-named locals at the head of `_enum`.

`fullName` / `friendlyName` should become `valueMethodName` /
`valueMethodAlias` (enum.rb:266, :271) in the same pass — they are free once
the surrounding locals move.

## Acceptance criteria

- [ ] `_enum` binds `name`, `scopes` and `instanceMethods` as Rails does, and
      passes them to `defineEnumMethods` under those names.
- [ ] `fullName` → `valueMethodName`, `friendlyName` → `valueMethodAlias`.
- [ ] Either `name` replaces `attrName` at the `defineEnumMethods` call sites,
      or the alias resolution is justified at the call site with the Rails
      `enum.rb:LINE` that motivates it.
- [ ] Both `enum.ts#_enum` → `define_enum_methods` `naming` rows are gone from
      `API_COMPARE_FORCE=1 pnpm parity:api --calls`, with no `shape` movement.
- [ ] `pnpm vitest run packages/activerecord/src/enum.test.ts` passes,
      including the alias_attribute-backed enum cases.
