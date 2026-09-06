---
title: "Delete AbstractController::Caching's pass-through wrappers around Fragments"
status: draft
updated: 2026-09-06
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/abstract-controller/caching.ts` defines six pass-through
wrappers around `./caching/fragments.js` — `combinedFragmentCacheKey`,
`writeFragment`, `readFragment`, `fragmentExist`, `expireFragment` and
`instrumentFragmentCache` — each of which does nothing but
`_name.call(this, ...args)`.

Rails has no such bodies. `AbstractController::Caching` acquires those methods
by `include AbstractController::Caching::Fragments`
(`vendor/rails/actionpack/lib/abstract_controller/caching.rb:29`); they are
defined once, in `caching/fragments.rb:68-147`. So each wrapper is a second
trails method for one Rails method, and it scores as extra surface in
`caching.ts` on top of the real definition in `fragments.ts`.

PR #7560 assigned `Base.prototype` from `caching/fragments.js` directly, which
is the correct source, so the wrappers now have no caller inside the include
path. Check `abstract-controller/index.ts:59-68` (the barrel re-exports both
sets) and `caching.test.ts` before deleting.

## Converged shape

Delete the six wrappers from `caching.ts`. Consumers import the names from
`./caching/fragments.js`, the file whose Rails counterpart defines them; the
barrel re-exports that one set. `caching.test.ts`'s fragment cases move to
`caching/fragments.test.ts` or import from `fragments.js`.

## Acceptance criteria

- [ ] `caching.ts` defines no method that `caching.rb` does not.
- [ ] `abstract-controller/index.ts` re-exports each fragment method once.
- [ ] `pnpm parity:api:extra --package actionpack` reports fewer extra names in
      `abstract-controller/caching.ts` than before.
