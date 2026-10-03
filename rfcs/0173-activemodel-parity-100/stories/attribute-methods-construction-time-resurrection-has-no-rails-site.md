---
title: "activemodel: AttributeMethods' construction-time initInternals resurrection has no Rails counterpart"
status: in-progress
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8442
claim: "2026-10-03T10:55:20Z"
assignee: "attribute-methods-construction-time-resurrection-has-no-rails-site"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of trails#8321 (`activemodel-audit-permanent-receipts-root`).
`packages/activemodel/src/attribute-methods.ts` prepends an `initInternals` onto every includer
(`prepend(base.prototype, { initInternals })` in the `included` hook) that calls
`_resurrectAttributeMethods(this.constructor)` before `super`: at each construction it re-runs
`defineAttributeMethods` for every attribute whose generated methods predate the class's current
`attribute_method_patterns`. It is tracked by two invented class memos, `_patternsGeneratedFor` and
`_patternsAtLastResurrection`.

Rails has none of this. `ActiveModel::AttributeMethods` defines no `initialize` and no
`init_internals` (the only two in activemodel are `validations.rb:467` and `dirty.rb:372`).
`attribute_method_prefix` / `_suffix` / `_affix` end in `undefine_attribute_methods`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:106-109,140-143,175-178,375-380`),
and from then on a call reaches the attribute through `method_missing` → `attribute_missing`
(`:507-522`) until something calls `define_attribute_methods` again.

CLAUDE.md § "Records are not Proxies" says a generated reader removed by `undefineAttributeMethods`
"comes back through `defineAttributeMethods`, or through construction". That sentence describes the
behaviour; it does not name `initInternals` / `_resurrectAttributeMethods` or the two memos as
sanctioned surface, so the receipt on `initInternals` cannot stay `PERMANENT` on it.

## Acceptance criteria

- [ ] Regeneration after `undefine_attribute_methods` reaches `defineAttributeMethods` from a site Rails has (the `define_attribute_methods` call each includer already makes), and `initInternals`, `_resurrectAttributeMethods`, `_patternsGeneratedFor` and `_patternsAtLastResurrection` are deleted — or, if no Rails site can carry it without a `method_missing` trap, this story is blocked naming that as the blocker.
- [ ] `packages/activemodel/src/attribute-methods.test.ts` and the activerecord `attribute-methods.test.ts` cases for a pattern declared after `define_attribute_methods` stay green.
- [ ] `pnpm parity:api:extra --package activemodel` drops `initInternals`.

## Verification

```bash
pnpm parity:api:extra --package activemodel && pnpm parity:api:calls && pnpm vitest run packages/activemodel/src/attribute-methods.test.ts
```
