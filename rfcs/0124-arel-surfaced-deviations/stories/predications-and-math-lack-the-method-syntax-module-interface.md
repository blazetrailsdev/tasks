---
title: "Predications/Math have no module interface, so a node subclass can't override a mixed-in member"
status: in-progress
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7110
claim: "2026-08-27T01:22:35Z"
assignee: "named-function-over-overrides-the-mixin-and-quotes-eagerly"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7102 (RFC 0124). Converting `Case#when` from a bound instance
property to a prototype method — needed so a generic `Object#clone`-shaped copy
could not carry it still closed over the original — produced a TS2425:

```
Class 'NodeExpression' defines instance member property 'when',
but extended class 'Case' defines it as instance member function.
```

`node-expression.ts` merges its mixin surface from five sources, and they are
not spelled alike. Three carry a hand-written module interface in **method**
syntax, which a subclass may override with a method declaration:

- `AliasPredicationModule` (`packages/arel/src/alias-predication.ts`)
- `OrderPredicationsModule` (`packages/arel/src/order-predications.ts`)
- `WindowPredicationsModule` (`packages/arel/src/window-predications.ts:9-15`)
  — which is exactly why `NamedFunction#over` converted with no TS complaint at
  all in the same PR.

`Predications` and `Math` have none, so they go through
`Included<typeof Predications>` — a mapped type, whose members are **property**
typed, which is what makes an override an error. The comment at
node-expression.ts:52-55 already records this asymmetry ("AliasPredication /
OrderPredications use their explicit module interfaces (method-syntax) so
subclasses ... don't trip the property-vs-method override error"), so the
pattern was known; `Predications` just never got one.

PR #7102 worked around it narrowly rather than fixing it, lifting the single
member out of the mapped shape:

```ts
// packages/arel/src/nodes/node-expression.ts
interface _PredicationsWhen {
  when(right: unknown): import("./case.js").Case;
}
export interface NodeExpression
  extends
    Omit<Included<typeof import("../predications.js").Predications>, "when">,
    _PredicationsWhen,
    ...
```

That is a one-member patch on a general problem: the next `Predications` or
`Math` member a node subclass wants to override hits the same TS2425 and gets
either a second `Omit` or a fresh bound-property (the shape #7102 was removing).

## Converged shape

Give `Predications` — and `Math` — the explicit method-syntax module interface
its three siblings already have (`PredicationsModule`, `MathModule`, declared in
`predications.ts` / `math.ts` and implemented by the existing const), then have
`node-expression.ts`, `infix-operation.ts`, `sql-literal.ts` and
`attributes/attribute.ts` extend those interfaces directly instead of
`Included<typeof …>`. Delete the `_PredicationsWhen` / `Omit<>` patch.

This is type surface only — no runtime change, and `include()` keeps wiring the
same const at the same call sites in `index.ts`.

## Acceptance criteria

- [ ] `predications.ts` exports a `PredicationsModule` interface in method
      syntax, and `Predications` is declared `: PredicationsModule`, matching
      `window-predications.ts:9-17`.
- [ ] Same for `math.ts` / `MathModule`.
- [ ] `node-expression.ts` extends the two interfaces directly; the
      `_PredicationsWhen` interface and the `Omit<…, "when">` are gone.
- [ ] `Case#when` still overrides as a prototype method with no TS2425 and no
      `@ts-expect-error`.
- [ ] `pnpm vitest run packages/arel/src` green; `parity:api` arel stays at
      100%, `parity:api:extra:gate` does not rise.
