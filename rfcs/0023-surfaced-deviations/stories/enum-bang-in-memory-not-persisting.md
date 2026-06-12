---
title: "Enum _enum bang setter is in-memory only; Rails persists via update!"
status: draft
updated: 2026-06-12
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while porting `adapters/postgresql/enum_test.rb` (PR #3160,
story `p3-pg-enum-orm-and-schema`).

Rails' enum generates a bang method (`record.status_active!`) that **persists**
— it calls `update!(status: "active")`. Our `_enum` macro
(`packages/activerecord/src/enum.ts`) instead generates an **in-memory-only**
bang:

```ts
// enum.ts — _enum bang setter
Object.defineProperty(this.prototype, `${methodBase}Bang`, {
  value: function (this: Base) {
    this.writeAttribute(attrName, value);
    return this; // in-memory only — does NOT persist
  },
  ...
});
```

Because of this, the `works with activerecord enum` test had to call
`current_mood_okayBang()` **followed by `save()`** rather than relying on the
bang to persist like Rails.

Note there is already a Rails-faithful persisting bang in
`EnumMethods.defineEnumMethods` (`${valueMethodName}!` → `updateBang(...)`) that
the `_enum` path does **not** use. Reconciling the two is the work.

Risk / why it's sized: several existing `enum.test.ts` cases rely on the current
synchronous in-memory bang (e.g. `(user).inactiveBang()` asserting state without
`await`/`save`). Switching `_enum` to the persisting bang must either update
those tests to match Rails semantics or preserve a separate in-memory variant.
Read the Rails enum bang (`active_record/enum.rb`) before changing.

## Acceptance criteria

- [ ] `_enum`-generated bang persists via `update!`/`updateBang`, matching Rails.
- [ ] `enum.test.ts` cases reconciled (Rails-faithful) with no net test loss.
- [ ] `works with activerecord enum` simplified to drop the explicit `save()`.
- [ ] api:compare and test:compare deltas non-negative.
