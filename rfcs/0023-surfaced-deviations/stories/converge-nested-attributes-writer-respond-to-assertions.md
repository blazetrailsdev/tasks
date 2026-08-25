---
title: "assert_respond_to for the nested-attributes writer is ported as a not-toThrow assignment"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: nested-attributes.test.ts:404-407, 640-643, 873-880 are now typeof(...)==='function' respond-to checks, not .not.toThrow()."
---

## Context

Rails' `test_should_define_an_attribute_writer_method_for_the_association` is a
one-line `assert_respond_to`:

- `vendor/rails/activerecord/test/cases/nested_attributes_test.rb:262-264` —
  `assert_respond_to @pirate, :ship_attributes=`
- `:463-465` — `assert_respond_to @ship, :pirate_attributes=`
- `:640-642` — the has_many arm, same shape

trails ports all three as "assigning does not raise" instead:

- `packages/activerecord/src/nested-attributes.test.ts:404-408`
- `:642-646`
- `:872-877` (parameterised via a `setter` local)

```ts
expect(() => {
  (pirate as any).shipAttributes = {};
}).not.toThrow();
```

That is a different assertion. `assert_respond_to` asks whether the writer
_exists_; the port runs it and asserts it is side-effect-free on an empty hash,
which passes for reasons Rails is not testing and would keep passing if the
writer were silently replaced by an inert property. It also shows up in
`parity:test` as an assertion-kind mismatch on three otherwise-matched tests.

The port was left as-is deliberately in PR #6159 rather than converged there:
while the synchronous `#{name}_attributes=` setter still ships, it is the member
Rails' `:ship_attributes=` names, and rewriting the assertion to point at
`set#{Name}Attributes` ahead of the setter's deletion would have dropped
coverage of live behavior. Once
`delete-nested-attributes-deferred-displacement` retires the setter, the
Rails-named member these tests should interrogate is the surviving awaitable
writer.

## Converged shape

Each of the three becomes a respond-to check on the writer that then exists —
the direct analogue of `assert_respond_to`:

```ts
expect(typeof (pirate as any).setShipAttributes).toBe("function");
```

Sequence with the setter deletion: if that story lands first, converge to the
awaitable writer's name; if this one is claimed while the setter still ships,
converge to a respond-to check on the _property setter_ descriptor rather than
leaving the `.not.toThrow()` shape, and let the deletion story retarget it.

## Acceptance criteria

- [ ] All three sites assert the writer responds, not that an assignment does
      not throw.
- [ ] Test names unchanged.
- [ ] `pnpm parity:test` delta non-negative; the three tests no longer report
      an assertion-kind mismatch (`pnpm parity:test --assertions`).
