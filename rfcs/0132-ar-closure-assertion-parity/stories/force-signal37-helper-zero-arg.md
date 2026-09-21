---
title: "force_signal37_to_load_all_clients_of_firm port takes a fixture-accessor parameter Rails has no counterpart for"
status: blocked
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: 8
pr: null
claim: null
assignee: null
blocked-by: "Needs has-many-associations-test-rails-member-order first (merges the 19 fixture-partitioned describes so one zero-arg helper can close over a single companies accessor). CLI has no set-deps verb; unblock when that story lands."
closed-reason: null
---

## Context

Rails' private test helper is zero-argument
(`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb:3249-3251`):

```ruby
def force_signal37_to_load_all_clients_of_firm
  companies(:first_firm).clients_of_firm.load_target
end
```

It reads `companies` from the class-level fixture accessor declared once at rb:118-123.

trails' port (merged in trails#7902,
`packages/activerecord/src/associations/has-many-associations.test.ts`) takes the accessor as a
parameter:

```ts
async function forceSignal37ToLoadAllClientsOfFirm(
  companies: (name: string) => unknown,
): Promise<unknown> {
  return await (companies("first_firm") as any).clientsOfFirm.loadTarget();
}
```

because `fixtures([...])` is declared per `describe` in trails, so there is no single `companies`
binding in scope for the five call sites, which sit in three different `describe` blocks.

This is **not a TypeScript language shortcoming** — it is a consequence of the fixture-block
partitioning of the file, and it converges when that partitioning does. The only two shapes
available while the file has 19 `HasManyAssociationsTest` describes are one definition with one
parameter (current) or three zero-argument copies (worse: Rails defines the helper once).

## Converged shape

One zero-argument `forceSignal37ToLoadAllClientsOfFirm`, defined after the tests, closing over
the single `companies` accessor of the merged describe — identical to rb:3249-3251.

This is unblocked by `has-many-associations-test-rails-member-order`, which merges the 19
describes into one carrying the union fixture set; do that first.

## Acceptance criteria

- `forceSignal37ToLoadAllClientsOfFirm` takes no parameters and its body matches
  rb:3249-3251 line for line.
- It is defined exactly once, after the test methods, mirroring Rails' placement.
- All five call sites call it with no arguments.
