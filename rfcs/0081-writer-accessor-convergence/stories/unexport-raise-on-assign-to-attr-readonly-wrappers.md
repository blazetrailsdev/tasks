---
title: "Delete getRaiseOnAssignToAttrReadonly/setRaiseOnAssignToAttrReadonly re-spellings"
status: done
updated: 2026-07-29
rfc: "0081-writer-accessor-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 5592
claim: "2026-07-29T19:04:52Z"
assignee: "unexport-raise-on-assign-to-attr-readonly-wrappers"
blocked-by: null
closed-reason: null
---

## Context

Left in place by #5564 (RFC 0081,
`convert-ar-config-accessors-internal-flags`), which deleted the `export let`

- `setX` pair for `raiseOnAssignToAttrReadonly` in `ar-config.ts` but could not
  touch these two, because they are index-exported public surface rather than
  `ar-config.ts` bindings.

`packages/activerecord/src/readonly-attributes.ts:27-33` still exports:

```ts
export function getRaiseOnAssignToAttrReadonly(): boolean;
export function setRaiseOnAssignToAttrReadonly(value: boolean): void;
```

Both are now one-line delegates to
`ActiveRecord.raiseOnAssignToAttrReadonly`, and both are re-exported from
`packages/activerecord/src/index.ts:253-257`.

Rails has neither. `raise_on_assign_to_attr_readonly` is a bare
`singleton_class.attr_accessor` on `module ActiveRecord`
(`vendor/rails/activerecord/lib/active_record.rb:342-343`); `getX`/`setX` are
exactly the writer/reader re-spelling RFC 0081 exists to remove, so this is
trails-only surface with a real accessor now sitting behind it.

Deleting them is a public-API break for external callers, same class as the
`export let` deletions the RFC already settled: the breakage is compile-time
and total, and `ActiveRecord.raiseOnAssignToAttrReadonly` is the Rails-spelled
replacement. No in-repo caller remains outside `readonly-attributes.ts` itself
and the `index.ts` re-export.

## Acceptance criteria

- `getRaiseOnAssignToAttrReadonly` / `setRaiseOnAssignToAttrReadonly` deleted
  from `readonly-attributes.ts` and from the `index.ts` export list.
- Any remaining caller reads/writes `ActiveRecord.raiseOnAssignToAttrReadonly`.
- `pnpm parity:api` matched count does not drop; `parity:api:extra` does not grow.
