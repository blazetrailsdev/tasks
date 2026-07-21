---
title: "Dot#visit UnsupportedVisitError translation is stale after #5002"
status: claimed
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 22
pr: null
claim: "2026-07-21T23:25:16Z"
assignee: "dot-visit-unsupported-translation-stale-after-typeerror"
blocked-by: null
closed-reason: null
---

## Context

`Dot#visit` (`packages/arel/src/visitors/dot.ts:508-525`) wraps
`super.visit(object)` in a try/catch that translates
`UnsupportedVisitError` into `TypeError("Cannot visit <Class>")`:

```ts
if (e instanceof UnsupportedVisitError) {
  throw new TypeError(`Cannot visit ${this.classNameOf(object)}`, { cause: e });
}
throw e;
```

That block was written (#5003) when `Visitor#visit`'s no-handler arm threw
`UnsupportedVisitError("Unknown node type: X")` — Dot translated it to the
Rails class/message at `visitor.rb:38`.

**#5002 changed the arm itself to throw `TypeError("Cannot visit <Class>")`
directly.** The translation layer is now stale in two ways:

1. **Vestigial.** The no-handler path no longer produces
   `UnsupportedVisitError`, so it falls through to the bare `throw e` and
   propagates the `TypeError` unchanged. Correct outcome, dead branch. The
   `{ cause: e }` rationale in the comment no longer applies to any live path.
2. **Actively wrong if reached.** `UnsupportedVisitError` is the _other_
   Rails terminal — a class whose handler is aliased to `unsupported`
   (`to_sql.rb:828`). Any such error surfacing inside Dot would now be
   relabelled as `Cannot visit X`, re-collapsing inside Dot the exact two
   terminals #5002 separated. Confirm reachability: Dot defines its own raw
   value handlers, so this may be unreachable today, but the branch encodes
   the wrong invariant either way.

Note also `classNameOf(object)` (Dot) vs `describeClass(object)`
(`visitor.ts`) are two different name derivations for the same message; with
the branch removed only `describeClass` remains, which is the one matching
`visitor.rb:38`.

## Acceptance criteria

- [ ] Determine whether `UnsupportedVisitError` is reachable from
      `super.visit` inside `Dot` at all; record the finding in the PR body.
- [ ] Remove the dead `instanceof UnsupportedVisitError` translation branch so
      the `TypeError` from `Visitor#visit` propagates unchanged, OR — if the
      error IS reachable — leave it propagating as `UnsupportedVisitError`
      rather than relabelling it.
- [ ] The stale `{ cause: e }` / `visitor.rb:39` comment block is removed or
      rewritten to describe the surviving behaviour.
- [ ] The mis-registered-dispatch `throw e` passthrough (plain `Error`) is
      preserved — see
      `visitor.test.ts` "distinguishes a mis-registered method from an unknown
      node type".
- [ ] `dot.test.ts` still covers a handler-less class reaching Dot and getting
      `TypeError, "Cannot visit X"`.
- [ ] api:compare / test:compare delta non-negative.
