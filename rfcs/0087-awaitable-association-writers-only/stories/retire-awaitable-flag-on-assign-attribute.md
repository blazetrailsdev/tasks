---
title: "_assignAttribute takes an awaitable flag Rails has no parameter for"
status: done
updated: 2026-08-08
rfc: "0087-awaitable-association-writers-only"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6210
claim: "2026-08-08T00:09:22Z"
assignee: "raw-test-and-second-connection-adapters-carry-a-real-pool"
blocked-by: null
closed-reason: null
---

## Context

Shipped by PR 6204 (`route-awaitable-callers-through-set-attributes`) and
justified at the call site, but a deviation worth converging.

Routing `#update` / `#update!` through `setAttributes` put both mass-assignment
drivers on one shared `_assignAttributes` generator. The association arm that
`#update` needs — resolving `posts` / `postIds` / `account` to
`association(name).writer` / `idsWriter` — must NOT be reachable from the
synchronous `assignAttributes`, because RFC 0087 §1 deliberately removed those
property setters and five tests enshrine the resulting
`unknown attribute` raise (`packages/activerecord/src/associations/`:
`collection-awaitable-writers.trails.test.ts`,
`has-one-persisted-setter-throws.trails.test.ts`,
`constructor-form-and-hmt-insert.test.ts`).

The gate is an `awaitable: boolean` parameter threaded through three functions in
`packages/activerecord/src/persistence.ts` — `_assignAttributes`,
`assignNestedParameterAttributes` and `_assignAttribute` — with
`assignAttributes` passing `false` and `setAttributes` passing `true`:

```ts
const associationWrite = awaitable ? associationWriterPromise(self, key, value) : undefined;
```

Rails has no such parameter. `_assign_attributes`
(`vendor/rails/activerecord/lib/active_record/attribute_assignment.rb:6-23`) and
`_assign_attribute`
(`vendor/rails/activemodel/lib/active_model/attribute_assignment.rb:67-75`) each
take only the attributes/key and value, and there is exactly one behaviour: the
setter exists, so `public_send` reaches it. One Rails method is now two
behaviours in trails, selected by a flag, which is the shape the fidelity rules
call out.

The root cause is upstream of this flag: `replace` and `ids_writer` do I/O at
assignment (`collection_association.rb:46-48, :61-83`) and `has_one`'s writer
persists the displacement inline (`has_one_association.rb:59-84`), none of which
a JS property setter can express. That is a genuine language shortcoming; the
flag is how it currently leaks into a ported signature.

## Converged shape

One behaviour per Rails method, with the sync/async split expressed somewhere
other than a parameter on three ported functions. Options to weigh, cheapest
first:

- Resolve the association writer unconditionally in `_assignAttribute` and let
  the SYNC driver reject the resulting promise, so the divergence lives in
  `assignAttributes`' own body (which already deviates by parking) rather than in
  the shared `_assign_attribute` port. The enshrined `unknown attribute` message
  would have to change, so check whether those five tests are asserting Rails
  behaviour or trails' deviation before touching them — `attribute_writer_missing`
  is what Rails raises for a truly absent setter, which these keys are not.
- Fold the gate into the setter-resolution step itself (a sync-visible setter set
  vs an awaitable one), so the branch reads as "does `#{key}=` exist here",
  matching Rails' `respond_to?(setter)` shape. Coordinate with
  `ar-assign-attribute-bypasses-attribute-writer-missing`, which touches the same
  branch.

Do NOT close this by widening the comment that justifies the flag.

## Acceptance criteria

- [ ] `_assignAttributes`, `assignNestedParameterAttributes` and
      `_assignAttribute` carry Rails' parameter lists (`attribute_assignment.rb:6,26,67`)
      with no `awaitable` flag.
- [ ] `#update` / `#update!` still reach the association writers — the guards
      `update awaits the has_one writer on a persisted owner` and
      `update assigns collection ids on a persisted owner` stay green.
- [ ] Synchronous `assignAttributes` still does not silently perform a
      write it cannot await; whatever it raises is justified against a Rails line.
- [ ] All of `packages/activerecord/src/associations/` green, plus the
      nested-attributes and persistence suites. No test renames.
