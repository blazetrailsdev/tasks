---
title: "assertEmpty/assertRespondTo bodies skip Minitest's respond_to pre-check and include_all"
status: draft
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR trails#8066 retired the false `@noRailsEquivalent` receipts on the Minitest helpers in `packages/activesupport/src/testing/assertions.ts` and renamed their parameters. It did not converge their bodies, which still differ from `vendor/minitest/lib/minitest/assertions.rb`:

- `assert_empty obj, msg = nil` (`:188-192`) and `refute_empty` (`:658-662`) first call `assert_respond_to obj, :empty?`, and only then assert `obj.empty?`. trails' `assertEmpty` / `assertNotEmpty` have no respond-to check and fall back to `length` / `size` / `Object.keys`.
- `assert_respond_to obj, meth, msg = nil, include_all: false` (`:453-458`) and `refute_respond_to` (`:803-807`) forward `include_all` to `obj.respond_to?(meth, include_all)`. trails drops the kwarg and uses its own `respondsTo`, not `rbObjRespondTo(obj, meth, includeAll)`.
- Failure messages were covered by the done story `activesupport-assertion-failure-messages-diverge-from-minitest`. Recheck `assert_respond_to`'s `"(#{obj.class}) to respond to ##{meth}"` form while doing this.

## Converged shape

- `assertEmpty(obj, msg)` calls `assertRespondTo(obj, "isEmpty")` (the `empty?` spelling), then `assert(obj.isEmpty(), msg)`. `assertNotEmpty` does the same and ends with `refute`.
- `assertRespondTo(obj, meth, msg, { includeAll = false } = {})` asserts `rbObjRespondTo(obj, meth, includeAll)`. `assertNotRespondTo` mirrors it.

## Acceptance criteria

- [ ] The four helper bodies mirror `assertions.rb:188-192,453-458,658-662,803-807`.
- [ ] Call sites that pass plain arrays or objects keep working (JS `Array` needs its `empty?` answer from ruby-compat), or they are converged.
- [ ] `parity:test:assertions` is green.
