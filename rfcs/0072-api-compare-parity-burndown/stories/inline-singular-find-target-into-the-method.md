---
title: "Free findTarget has no production caller left — one Rails method should be one TS method"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activerecord
deps:
  - converge-singular-find-target-test-callers-to-the-reader
deps-rfc: []
est-loc: 300
priority: null
pr: 6235
claim: "2026-08-08T14:02:06Z"
assignee: "sqlite-in-memory-predicate-disagrees-with-adapter"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/associations/singular-association.ts` exports a free
`findTarget(record, assocName, options)` alongside the class. Its own JSDoc
already calls the owner/name/options triple "a trails-only calling convention,
not Rails surface".

After #6139 that convention has **no production caller left**. The only
non-test imports of `associations/singular-association.js` are
`belongs-to-association.ts:7`, `has-one-association.ts:13` and
`builder/has-one.ts:2`, and all three import the `SingularAssociation` class,
not the function. `SingularAssociation#findTarget` — reached only through
`Association#loadTarget` → `_findTarget` — is its sole caller, and it forwards
`this.owner` / `this.reflection.name` / `this.reflection.options`, i.e. it
reconstitutes from `this` exactly the triple the free function then re-resolves
back into a reflection (`ctor._reflectOnAssociation(assocName)`).

Rails has one method:

```ruby
# vendor/rails/activerecord/lib/active_record/associations/singular_association.rb:47-55
def find_target(async: false)
  if disable_joins
    if async then scope.load_async.then(&:first) else scope.first end
  else
    super
  end
end
```

One Rails method is one TS method (CLAUDE.md, "Decomposition"). The split into
a class method that only unpacks `this` plus a free function that re-packs it is
extra indirection Rails does not have, and it is what keeps a dozen test call
sites reaching past the association object.

## Converged shape

Inline the free `findTarget`'s body into
`SingularAssociation#findTarget`, reading `this.owner` / `this.reflection`
directly (as the method's JSDoc already claims it does), and delete the export.
The private helpers it calls (`_builtAssociationScope`,
`_loadSingularViaStatementCache`, `_skipSingularStatementCache`, …) stay where
they are — only the owner/name/options seam goes.

Test call sites move to the association object or the generated reader in the
same change; see the sibling story
`converge-singular-find-target-test-callers-to-the-reader`, which should land
first or together.

## Acceptance criteria

- [ ] `singular-association.ts` exports no free `findTarget`; the body lives in
      `SingularAssociation#findTarget`.
- [ ] No caller passes an owner/name/options triple for a singular load.
- [ ] `pnpm parity:api:extra --package activerecord` does not grow;
      `singular-association.ts` stays at 0 novel extra surface.
- [ ] Association / preloader / disable-joins suites pass on SQLite, PostgreSQL
      and MySQL with no test renames.
