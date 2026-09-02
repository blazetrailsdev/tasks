---
title: "guard-base-method-delegation-compares-off-class-name"
status: draft
updated: 2026-09-02
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`guardBaseMethodDelegation`
(`packages/activerecord/src/relation/delegation.ts:152`) walks the prototype
chain to find `ActiveRecord::Base` by comparing class NAMES:

```ts
while (typeof base === "function" && (base as { name?: string }).name !== "Base") {
```

It mirrors `Base.respond_to?(method)` in
`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:120` — Ruby
names the constant `Base` directly, so no walk and no name compare happens at
all. The TS walk is there because the module could not import `base.js` back
without closing an ESM cycle.

That is the same string-name-collision class PR #7389 converged everywhere it
was spelling Rails' `self == Base`: a subclass a user happens to call `Base`
hijacks the walk, and a bundler that mangles or a class that overrides `name`
misses it. #7389 deliberately left this site alone because it is NOT a
`self == Base` comparison and so fell outside
`converge-base-identity-compare-off-class-name`'s stated scope; the reviewer
raised it as a follow-up.

The blocker that forced the name compare is now gone: #7389 added
`packages/activerecord/src/base-slot.ts`, the zero-import slot holding the
`Base` constructor (the shape CLAUDE.md ratifies for exactly this — a constant
Ruby resolves at call time whose eager ESM import would close a cycle).
`delegation.ts` can import `_Base` from it and compare identity.

`persistence.ts:137`'s name compare is NOT part of this: it mirrors
`persistence.rb:223-228`'s `base_class?`, not a `Base` identity check, and
should stay as it is.

## Acceptance criteria

- [ ] `guardBaseMethodDelegation` reaches `Base` through `_Base` from
      `base-slot.ts` rather than comparing `constructor.name` to `"Base"`.
- [ ] Entry-module import of `packages/activerecord/dist/relation/delegation.js`
      in its own node process does not throw (a vitest run enters the funnel
      module first and masks a TDZ, so it proves nothing here).
- [ ] `pnpm parity:api:calls` / `:calls:args` show no new row.
- [ ] `packages/activerecord/src/relation` and
      `packages/activerecord/src/relations.test.ts` stay green.
