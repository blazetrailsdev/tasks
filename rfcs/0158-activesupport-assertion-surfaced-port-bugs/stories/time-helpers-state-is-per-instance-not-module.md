---
title: "TimeHelpers simple_stubs / in_block are per-instance (time_helpers.rb:262-266), not module state; unskip travel to with separate class"
status: draft
updated: 2026-09-30
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails keeps `TimeHelpers` state **per including instance**:
`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/time_helpers.rb:262-266`
(`def simple_stubs; @simple_stubs ||= SimpleStubs.new; end` and
`attr_accessor :in_block`). `travel_to`'s nested-block guard (`:133-134`,
`if block_given? && in_block`) and its `ensure` (`:195-203`,
`self.in_block = true/false`) read and write that instance's flag, and
`travel_back` (`:231-234`) unstubs only that instance's `simple_stubs`.

trails holds both at module scope: `packages/activesupport/src/testing/time-helpers.ts:70-71`
(`let _simpleStubs`, `let _inBlock`), reached through the module functions at
`:218-229`. As a result every caller shares one stub registry and one `in_block` flag.

That is observable in `test_time_helper_travel_to_with_separate_class`
(`vendor/rails/v8.0.2/activesupport/test/time_travel_test.rb:181-203`). A
`TravelClass` object includes `TimeHelpers` and calls `travel_to` (with and without
a block) inside the test's own `travel_to(date1) do … end`. In Rails the inner
object's stubs and `in_block` are its own: a no-block `travel_to` on it is not
unwound by the outer block's `travel_back`, and its block form does not trip the
outer instance's `in_block` guard. In trails it is `it.skip`
(`packages/activesupport/src/time-travel.test.ts`, "time helper travel to with
separate class").

## Converged shape

`TimeHelpers` is a module mixed into its host (`include()` / `Included<>`, see
CLAUDE.md "Module mixins"), and `simpleStubs` / `inBlock` are per-host state, as
Rails' ivars are. `travelTo`, `travelBack`, `travel`, `freezeTime` and
`afterTeardown` read that host's state. The AR / AS test-case bases that include
`TimeHelpers` get it through the mixin. Any module-level convenience entry points
the suite relies on stay only if they route through a host instance.

## Acceptance criteria

- No module-scope `_simpleStubs` / `_inBlock` in `testing/time-helpers.ts`. State
  lives on the including instance.
- `it("time helper travel to with separate class")` is unskipped with Rails'
  body (a `TravelClass` including TimeHelpers, `travel_to_no_block` /
  `travel_to_block`) and all of its assertions.
- Existing `time-travel.test.ts` cases stay green, and `parity:api:calls` /
  `parity:api:extra:gate` show no new rows.
