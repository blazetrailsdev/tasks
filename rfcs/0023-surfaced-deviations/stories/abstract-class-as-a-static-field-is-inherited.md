---
title: "static abstractClass = true shadows the accessor and every subclass inherits it"
status: draft
updated: 2026-10-09
rfc: "0023-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by trailmap (trailmap#48), writing its first abstract base class — the
`Hub` that owns the connection to its second database.

`abstractClass` is implemented as an accessor pair with Rails' per-class
semantics, which is right:

```ts
// packages/activerecord/src/inheritance.ts
static get abstractClass() {
  return Object.prototype.hasOwnProperty.call(this, "_abstractClass")
    ? this._abstractClass
    : false;
}
```

A subclass of an abstract class is therefore not itself abstract — exactly as
`defined?(@abstract_class) && @abstract_class == true` behaves in Rails.

But the natural TypeScript spelling defeats it:

```ts
export class Hub extends Base {
  static abstractClass = true; // a class FIELD
}
export class Owner extends Hub {}
```

A static field defines an own DATA property on `Hub`, shadowing the inherited
accessor, and a static data property IS inherited down the class chain. So
`Owner.abstractClass` is `true`, and the first write fails:

```text
NotImplementedError: Owner is an abstract class and cannot be instantiated.
    at new Base (activerecord/src/base.ts:1590:15)
    at new Owner (app/models/owner.ts:19:8)
    at Owner.create (activerecord/src/persistence.ts:68:18)
```

The setter form works, because it reaches the accessor:

```ts
export class Hub extends Base {
  static {
    this.abstractClass = true;
  }
}
```

Two reasons this is worth fixing rather than documenting:

- `static abstractClass = true` is what a Rails reader writes, and what the
  type declaration (`static abstractClass: boolean` on `Base`) invites.
- The failure is distant from the cause. Nothing goes wrong at the class that
  carries the field; it goes wrong at the first `create` on a subclass, which
  reads as a bug in the subclass.

The same shape threatens any `static` on `Base` that is really an accessor
over a per-class ivar.

## Converged shape

Make the internal reads own-property-aware so a field cannot be inherited as
truth — the check consults the class's OWN `abstractClass` before falling back
to the inherited accessor — or refuse the field form loudly where it is
detectable (an own data property named `abstractClass` on a class whose parent
exposes the accessor).

Whichever is chosen, the invariant is the one Rails has: `abstractClass` is
true only for the class that set it.

## Acceptance criteria

- [ ] `class A extends Base { static abstractClass = true }` and
      `class B extends A {}` leaves `B.abstractClass` false and `B.create()`
      working.
- [ ] The static-block form keeps behaving as it does today.
- [ ] `isDescendsFromActiveRecord`, `setBaseClass`, `connectsTo` and
      `connectedTo` — the four internal readers of `abstractClass` — are
      covered by the test, since each decides something different (table name,
      base class, connection ownership).
- [ ] An audit of the other accessor-backed statics on `Base` for the same
      field-shadowing hazard, with anything found either fixed or listed in
      the story's closing note.
