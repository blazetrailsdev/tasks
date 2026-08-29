---
title: "converge-store-accessor-keys-to-positional"
status: done
updated: 2026-08-29
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 16
pr: 7192
claim: "2026-08-28T23:28:33Z"
assignee: "rehome-store-accessors-module-and-local-stored-attributes"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Store::ClassMethods#store_accessor` is
`store_accessor(store_attribute, *keys, prefix: nil, suffix: nil)`
(`vendor/rails/activerecord/lib/active_record/store.rb:117`), and its body opens
with `keys = keys.flatten` (`:118`). A model body writes
`store_accessor :settings, :privileges, :servants` — the keys are positional.

trails takes them as an option instead —
`storeAccessor(storeAttribute, { accessors, prefix, suffix })` in
`packages/activerecord/src/store.ts:290` — so every call site passes an
`accessors:` key Rails does not have, and `#store`'s own inner call
(`store.rb:109` — `store_accessor(store_attribute, options[:accessors],
**options.slice(:prefix, :suffix))`) cannot match argument-for-argument either.

Surfaced while rehoming the two macros as class methods under
`rehome-store-and-store-accessor-as-class-methods` (PR #7187), which converged
the receiver but deliberately left the parameter list alone: the flip touches
every `storeAccessor` call site in the repo (tests, `test-helpers/models/`,
`cases/`, the hstore and encryption suites) and belongs in its own PR.

Note `#store`'s `options[:accessors]` stays an option — it is one there in Rails
too; only `store_accessor`'s own keys are positional.

## Acceptance criteria

- [ ] `storeAccessor` takes the keys positionally after `storeAttribute`, with
      `prefix` / `suffix` as the trailing options object, and flattens them
      (`keys.flatten`, store.rb:118).
- [ ] `store` calls it the way store.rb:109 does.
- [ ] Every call site moves to the positional spelling.
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:params` deltas
      non-negative; activerecord suite green on all three lanes.
