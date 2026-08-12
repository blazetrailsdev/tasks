---
title: "Delete the unreachable AttributeMethods#_touchRow re-export shim"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6418
claim: "2026-08-12T15:36:57Z"
assignee: "call-args-ar-connection-adapters-blocks"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/attribute-methods.ts:998-1003` exports `_touchRow`,
a re-export shim that forwards to `attribute-methods/dirty.ts#_touchRow`:

```ts
export function _touchRow(this: InstanceMethodHost, attributeNames: string[], time?: any) {
  return __touchRow.call(this as any, attributeNames, time);
}
```

Nothing calls it. `base.ts:4843` wires `_touchRow: _Persistence._touchRow`, and
the dirty layer is reached from there, not through this wrapper — grep the
package for `AttributeMethods._touchRow` / an import of `_touchRow` from
`./attribute-methods.js` and there are no hits.

`attribute_methods.rb` defines no `_touch_row`. The method lives in
`attribute_methods/dirty.rb:207-231`, which trails ports at
`attribute-methods/dirty.ts` — so this wrapper mirrors nothing in its own
file's Ruby counterpart and scores nothing that `attribute-methods/dirty.ts`
does not already score.

This is the same defect #6412 removed for the sibling
`_createRecord`/`_updateRecord` wrappers in this file (they were deleted, and
`pnpm parity:api` totals were byte-identical before and after, confirming the
credit comes from `attribute-methods/dirty.ts`). `_touchRow` was left alone
only because it was out of that PR's scope.

## Converged shape

Delete `_touchRow` and its `_touchRow as __touchRow` import from
`attribute-methods.ts`. Verify `pnpm parity:api` totals are unchanged (the
`attribute_methods/dirty.rb` credit is held by `attribute-methods/dirty.ts`),
and that `pnpm parity:api:extra --package activerecord` does not grow.

## Acceptance criteria

1. `attribute-methods.ts` exports no `_touchRow`; the unused
   `__touchRow` import is gone.
2. `pnpm parity:api` totals unchanged (no lost credit).
3. `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; no new
   baseline rows.
4. Dirty / touch / touch-later suites stay green.
