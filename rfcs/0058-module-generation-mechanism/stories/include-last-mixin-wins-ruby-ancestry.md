---
title: "include() should match Ruby ancestry (last-included mixin wins), retiring manual prototype overrides"
status: claimed
updated: 2026-07-03
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-07-03T22:07:09Z"
assignee: "include-last-mixin-wins-ruby-ancestry"
blocked-by: null
---

## Context

trails' `include()` (`packages/activesupport/src/include.ts:108`) skips any
method already defined on the target prototype:

```ts
// Ruby's include doesn't replace methods already defined on the class
if (Object.prototype.hasOwnProperty.call(klass.prototype, key)) continue;
```

This is **backwards** from Ruby for the common "two mixins define the same
method" case. In Ruby, `include A; include B` puts B higher in the ancestry,
so **B's** method wins. trails keeps **A's** (the first-included) and silently
drops B's.

This bit `TouchLater#touch` vs `Timestamp#touch`: Rails includes `TouchLater`
after `Timestamp`, so `TouchLater#touch` (the deferred-attr merge) overrides.
In trails, `Timestamp.InstanceMethods` is included first, so its `touch` won
and the deferred merge was dead code until manually patched in PR #4173:

```ts
// base.ts:4599
(Base.prototype as any).touch = TouchLater.touch;
```

The same workaround already exists for `_Aggregations.reload` overriding
`Persistence#reload` (base.ts:4604). These manual `(Base.prototype as any).x =`
assignments are a smell: every cross-mixin override has to be hand-wired and
remembered, and the `declare x: typeof Mod.x` type annotation can silently
diverge from the runtime wiring.

## Acceptance criteria

- [ ] Decide the convergence: either (a) make `include()` match Ruby ancestry
      (last-included wins, i.e. later `include` replaces an earlier mixin's
      method but still NOT a method defined directly on the class body), or
      (b) add an explicit, type-checked override mechanism so the manual
      `(Base.prototype as any).x =` assignments are no longer needed.
- [ ] Audit existing manual prototype overrides in base.ts (`touch`, `reload`,
      `initializeDup`) and fold them into the chosen mechanism, or document why
      each must stay hand-wired.
- [ ] Add a regression test asserting that a later `include` of a module whose
      method collides with an earlier mixin wins (and that a method defined
      directly in the class body still beats both).
- [ ] No behavior change to the patched `touch`/`reload` paths (they remain
      correct under the new mechanism).

## Notes

Distinguish carefully: Ruby's include does NOT override a method defined in the
**class body itself** — only earlier-included **modules**. The current code
conflates "defined on prototype" with "defined in class body". Any fix must
preserve class-body precedence.
