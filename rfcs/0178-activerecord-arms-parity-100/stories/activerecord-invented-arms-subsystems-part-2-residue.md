---
title: "activerecord: residue of invented arms beside subsystems part 2 (_createRecord, UnsignedInteger#maxValue, TypeMap#lookup default)"
status: done
updated: 2026-10-07
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8607
claim: "2026-10-07T00:03:13Z"
assignee: "quoting-js-date-guard-arms-have-no-rails-counterpart"
blocked-by: null
closed-reason: null
---

## Context

Left over from trails#8547 (story `activerecord-converge-invented-control-flow-arms-subsystems-part-2`). These sit beside
that story's rows in `pnpm parity:api:arms:report --package=activerecord --direction=invented` but were not in its list.
Rails paths are under `vendor/rails/v8.0.2/`.

- `packages/activerecord/src/locking/optimistic.ts#_createRecord` — `+if`. Rails
  (`activerecord/lib/active_record/locking/optimistic.rb:78-84`) is `if locking_enabled?` then
  `attribute_names |= [self.class.locking_column]`. The port tests `!attributeNames.includes(col)` and spreads.
  Converged shape: `attributeNames = union(attributeNames, [ctor.lockingColumn])` with ruby-compat's `union` (`Array#|`).
  This was written and verified in trails#8547 and reverted only for the LOC ceiling.
- `packages/activerecord/src/type/unsigned-integer.ts#maxValue` — `+if`. Rails
  (`activerecord/lib/active_record/type/unsigned_integer.rb:7-9`) is `super * 2`. The port branches on
  `typeof max === "bigint"`, because `IntegerType#maxValue` answers `number | bigint`
  (`packages/activemodel/src/type/integer.ts`, `narrowBigInt`). Converge through one integer multiply that
  serves both, or settle the representation in `IntegerType`.
- `packages/activerecord/src/type/hash-lookup-type-map.ts#lookup` and `type-map.ts#lookup` yield `new ValueType()`
  where Rails yields `Type.default_value` (`activerecord/lib/active_record/type/hash_lookup_type_map.rb:12-14`,
  `type_map.rb:13-15`; `activerecord/lib/active_record/type.rb` `default_value` is a memoized `Value.new`).
  A plain import of `../type.js` closes a cycle (`type.ts` re-exports both maps); verify with a built-`dist` entry import.

## Acceptance criteria

- [ ] `_createRecord` is `if locking_enabled?` + `union`, with no `includes` test.
- [ ] `UnsignedInteger#maxValue` has no `typeof` arm.
- [ ] Both `lookup` bodies yield `Type.default_value` (one shared instance, as Rails memoizes), with no TDZ on a built-`dist` entry import of either map.
- [ ] The invented-direction report shows no row for these three files; `parity:api:calls`, `calls:args`, `blocks`, `pins` stay green.
