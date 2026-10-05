---
title: "activemodel: define_method_attribute's reader raises through missing_attribute, not an inline throw"
status: done
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8504
claim: "2026-10-04T22:27:18Z"
assignee: "define-method-attribute-raises-through-missing-attribute"
blocked-by: null
closed-reason: null
---

## Context

`defineMethodAttribute` in `packages/activemodel/src/attribute-methods.ts` (the ActiveModel reader hook CLAUDE.md § "Generated attribute readers are properties" ratifies) raises `MissingAttributeError` from its own inline `throw`, with a hand-built copy of the message:

```ts
if (!this._attributes.getAttribute(canonicalName).isInitialized()) {
  throw new MissingAttributeError(`missing attribute '${canonicalName}' for ${…}`);
}
```

Rails has one raise site for that error, `missing_attribute(attr_name, stack)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/attribute_methods.rb:552-554`), and the generated reader reaches it with `caller`: `_read_attribute(name) { |n| missing_attribute(n, caller) }` (`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/read.rb:38`). trails#8501 made `missingAttribute` take the `caller` array and set it through `excSetBacktrace`, and moved ActiveRecord's reader (`packages/activerecord/src/attribute-methods/read.ts`) onto it. The ActiveModel hook was left with the second, inline raise site and no backtrace argument.

Converged shape: the generated getter calls `this.missingAttribute(canonicalName, rbFCaller())` in place of the inline `throw`, so the message and the raise site are Rails' one.

## Acceptance criteria

- [ ] `defineMethodAttribute`'s generated getter raises through `missingAttribute(canonicalName, rbFCaller())`; no second `new MissingAttributeError(...)` remains in `attribute-methods.ts`.
- [ ] The existing uninitialized-attribute tests in `packages/activemodel/src` still pass, and one asserts the error's backtrace is the caller's frames.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:arms:throws` and `pnpm parity:api:pins` stay green.
