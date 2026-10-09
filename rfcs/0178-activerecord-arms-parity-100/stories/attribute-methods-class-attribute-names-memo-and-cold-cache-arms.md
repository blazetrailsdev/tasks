---
title: "activerecord: class-level attribute_names carries an invented memo test and cold-cache arm"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AttributeMethods::ClassMethods#attribute_names`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods.rb:236-242`) is one
memoized conditional:

```ruby
@attribute_names ||= if !abstract_class? && table_exists?
  attribute_types.keys
else
  []
end.freeze
```

The port is the `attributeNames` member of `ClassMethods` in
`packages/activerecord/src/attribute-methods.ts`. Until the PR that closed
`activerecord-converge-missing-control-flow-arms-residue` it was a module-private
`classAttributeNames` function, so the arms report paired Rails' class method with the instance
`attributeNames` (`attribute_methods.rb:334`) and read `-if`. Paired correctly it reads `+if +if`:

- the own-property memo test (`Object.prototype.hasOwnProperty.call(this, "_attributeNamesMemo")`
  then `if (memo) return memo.names`), where Rails has `||=`;
- the cold-cache arm (`if (exists !== undefined)`), which skips the memo and the freeze when
  `cachedTableExists` answers `undefined`. Rails freezes and memoizes on every path.

`cachedTableExists` (`packages/activerecord/src/model-schema.ts`) is the tri-state peek that
`packages/activerecord/CLAUDE.md` § "Schema reflection peeks at a warm cache" ratifies, so the
cold answer itself stays. What is not ratified is the shape around it.

## Acceptance criteria

- [ ] `ClassMethods.attributeNames` is Rails' one conditional under one memo: the `if` / `else`
      picks `hashKeys(this.attributeTypes())` or `[]`, the result is frozen on every path, and the
      memo read is the `??=`-shaped spelling of `||=` through an own-property guard.
- [ ] The cold-cache arm is either gone or carries `@inventedArm if` with the receipt its
      ratifying section allows.
- [ ] `pnpm parity:api:arms:report --package=activerecord` has no
      `attribute-methods.ts#attributeNames` count row.
