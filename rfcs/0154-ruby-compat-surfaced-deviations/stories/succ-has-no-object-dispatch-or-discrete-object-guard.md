---
title: "Range#step's successor arm type-switches where Ruby sends succ behind discrete_object_p"
status: draft
updated: 2026-09-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`succ` has no object dispatch in trails, so `Range#step`'s successor arm spells
the discrete types out inline instead of sending `succ` the way Ruby does.

Ruby's `range_step` reaches its final arm through `discrete_object_p`
(`vendor/ruby/range.c:346-365`), which admits a `Numeric`, a `Time`, or
anything whose class defines `succ`, and raises
`TypeError: can't iterate from <class>` otherwise. The arm then iterates with
`rb_funcallv(b, id_succ, 0, 0)` (`:556`) — one send, dispatched on the object.

trails has `succ` for String only (`packages/ruby-compat/src/string/succ.ts:25`,
exported from `index.ts:180`). trails#7903 added the successor arm to
`Range#step` and had to stand in for the send with a module-private `objSucc`
in `packages/ruby-compat/src/range.ts`:

```ts
function objSucc<T>(v: T): T {
  if (typeof v === "string") return succ(v) as T;
  if (typeof v === "number") return (v + 1) as T;
  const o = v as { add?: (d: { days: number }) => T };
  if (typeof o?.add === "function") return o.add({ days: 1 });
  throw new TypeError(`can't iterate from ${...}`);
}
```

Three things diverge:

- **The dispatch is a type switch, not a send.** Every discrete type a Range can
  carry has to be enumerated in `range.ts`, so a new one is invisible to it.
- **The Temporal arm duck-types `.add`** and hard-codes `{ days: 1 }`, which is
  `Date#succ` (`vendor/ruby/ext/date/date_core.c` `d_lite_next`). Anything else
  carrying an `add` method — a `Temporal.PlainTime`, a `Duration` — is silently
  advanced by a day rather than rejected.
- **There is no `discrete_object_p`.** Ruby checks the guard up front and
  raises before iterating; trails only fails on the first `objSucc` call, and
  only for a value with no `add`.

## Converged shape

- A `succ` dispatch in `ruby-compat` covering the discrete types Ruby's
  `discrete_object_p` admits, with the String case delegating to the existing
  `string/succ.ts`. `Date`/`DateTime` succ is +1 day; `Integer` succ is +1.
- A `discreteObjectP` guard mirroring `range.c:346-365`, raising
  `TypeError: can't iterate from <class>` at the same point Ruby raises it.
- `Range#step` sends `succ` and drops `objSucc`.

## Acceptance criteria

- [ ] `objSucc` is gone from `packages/ruby-compat/src/range.ts`; the successor
      arm sends a shared `succ`.
- [ ] A non-discrete endpoint raises `TypeError: can't iterate from <class>`
      before iteration, as `range.c:346-365` does.
- [ ] A `Temporal.PlainTime` endpoint is rejected rather than advanced a day.
- [ ] `("a".."g").step(2)`, `(0..10).step(2)` and the DateTime-range arms of
      `core_ext/range_ext_test.rb:273-280` stay green.
