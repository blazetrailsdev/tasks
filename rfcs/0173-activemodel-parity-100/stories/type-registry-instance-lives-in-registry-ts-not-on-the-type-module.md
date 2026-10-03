---
title: "activemodel: Type's registry instance is a constant in type/registry.ts, not Type's own attr_accessor"
status: claimed
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-03T11:55:23Z"
assignee: "bcrypt-generate-salt-reaches-bc-salt"
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Type` holds its registry on the module itself
(`vendor/rails/v8.0.2/activemodel/lib/active_model/type.rb:22-26`):

```ruby
@registry = Registry.new

class << self
  attr_accessor :registry # :nodoc:
```

and `register` / `lookup` go through that accessor (`type.rb:30-36`).

trails instead exports the instance as a constant from the Registry file —
`export const typeRegistry = new TypeRegistry()`
(`packages/activemodel/src/type/registry.ts:47`), carrying
`@noRailsEquivalent CONVERGEABLE type-registry-instance-lives-in-registry-ts-not-on-the-type-module`.
`type/registry.rb` defines the class and nothing else. `type.ts`'s `registry()`
/ `register()` / `lookup()` (`packages/activemodel/src/type.ts:17-31`) read the
constant directly, so there is no writer half of `attr_accessor :registry`, and
three other sites bypass `Type` and name the constant:

- `packages/activemodel/src/attribute-registration.ts:254` —
  `typeRegistry.lookup(name, options)` where Rails calls
  `Type.lookup(name, **options)` (`attribute_registration.rb:106`).
- `packages/activerecord/src/type.ts:133-137` — registers `date`, `datetime`,
  `time`, `text`, `json` onto ActiveModel's registry, where
  `ActiveRecord::Type` has its own `@registry = AdapterSpecificRegistry.new`
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/type.rb:23`).
- `packages/activemodel/src/index.ts` — re-exports `typeRegistry` at the barrel
  and inside `Types`.

Found by `activemodel-audit-permanent-receipts-subdirs`: no CLAUDE.md section
ratifies a registry constant, so the PERMANENT receipt was re-tagged.

## Acceptance criteria

- [ ] The registry instance is `Type`'s own state in `type.ts`, read through
      `registry()` and written through the `attr_accessor`'s writer half at the
      conventions-table name; `typeRegistry` is deleted from `type/registry.ts`
      and from `index.ts`.
- [ ] `attribute-registration.ts` calls `Type.lookup` as `attribute_registration.rb:106` does.
- [ ] `activerecord/src/type.ts` no longer registers onto ActiveModel's registry
      (file the AR half separately if it does not fit).
- [ ] Verify the import direction with a plain-node import of the built
      `dist/type.js` and `dist/attribute-registration.js` as entry modules.

## Verification

```bash
pnpm parity:api:extra --package activemodel && pnpm parity:api:receipts:gate && pnpm vitest run packages/activemodel/src/type.test.ts packages/activemodel/src/type/registry.trails.test.ts
```
