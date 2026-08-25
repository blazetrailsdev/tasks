---
title: "spell Kernel#Array as Array in batches.ts via the aliased import"
status: done
updated: 2026-08-18
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: 6709
claim: "2026-08-18T18:32:42Z"
assignee: "sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling"
blocked-by: null
closed-reason: null
---

## Context

`relation/batches.rb` calls `Kernel#Array` at :93, :165, :260, :306, :310,
:323 and :387-388. PR #6633 converged those call sites onto `kernelArray`
(`packages/activesupport/src/array-utils.ts`), which leaves two report-only
`naming` rows in `pnpm parity:api:calls:args:report`:

```text
relation/batches.ts  batch_on_loaded_relation  compare_values_for_order
  ruby ['ref:values', 'ref:Array', 'ref:order']
  ts   ['ref:values', 'ref:kernelArray', 'ref:order']
```

The settled way to spell this so the body reads as Rails does is the aliased
import already used at `packages/activerecord/src/encryption/cipher.ts:9`:

```ts
import { kernelArray as Array } from "@blazetrails/activesupport";
```

`batches.ts` cannot take that alias as-is because the file still uses the JS
global under the same name — `Array.isArray(relation._records)` in
`batch_on_loaded_relation` and `Array.isArray(order)` in the `:order`
validation. Those reads have to move to `globalThis.Array.isArray` first (the
file already spells it that way nowhere, while `oid/array.ts` does it
throughout for exactly this reason).

Note the `:order` validation is separately tracked by
`converge-batches-order-validation-kernel-array`; sequence after it lands so
the two do not collide in the same lines.

## Acceptance criteria

- [ ] `batches.ts` imports `kernelArray as Array`, so every `Kernel#Array`
      call site reads `Array(...)` exactly as `batches.rb` does.
- [ ] Remaining uses of the JS global in the file are spelled
      `globalThis.Array`, as `oid/array.ts` already does.
- [ ] Both `batches.ts` naming rows clear in `pnpm parity:api:calls:args:report`,
      no new `shape` rows.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
