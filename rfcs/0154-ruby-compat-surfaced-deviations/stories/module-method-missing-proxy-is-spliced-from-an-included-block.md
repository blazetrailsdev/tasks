---
title: "A Module defining method_missing gets its Proxy from a hand-written included block (RoutingAssertions, TestFixtures) instead of from append_features"
status: draft
updated: 2026-10-02
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8406 (`action-dispatch-assertions-is-not-an-includable-module`).

Ruby dispatches `method_missing` for any module that defines it, with no hook on
the includer. Two trails modules carry a `methodMissing` in their carrier and
each splices its own Proxy beneath its link from a Concern `included` block:

- `ActiveRecord::TestFixtures` (`packages/activerecord/src/test-fixtures.ts`,
  the `included` block's `Object.setPrototypeOf(link, new Proxy(...))`). Rails
  has an `included do` there (`activerecord/lib/active_record/test_fixtures.rb:26-42`),
  but it does not contain this.
- `ActionDispatch::Assertions::RoutingAssertions`
  (`packages/actionpack/src/action-dispatch/testing/assertions/routing.ts`,
  `spliceMethodMissing`, called from an `included` block). Rails'
  `RoutingAssertions` has **no** `included do` block at all
  (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/assertions/routing.rb:15-16`);
  the block exists only to place the Proxy. `method_missing` itself is at
  `routing.rb:265-271`.

Both traps are hand-written copies of the same shape: read through the target,
and on a miss ask the receiver (`respondToMissing`, or the route-defined check)
before handing back a function that calls `methodMissing`. `spliceMethodMissing`
carries `@noRailsEquivalent PERMANENT`.

Related, not duplicates: `move-method-missing-proxy-to-ruby-compat` and
`extract-method-missing-proxy-helper` are about `methodMissingProxy` for
instances returned from constructors, not about a `Module`'s link.

## Converged shape

`Module#appendFeatures` (`packages/ruby-compat/src/include.ts`) splices the
method_missing Proxy beneath the link itself when the module's carrier defines
`methodMissing`, consulting the carrier's `respondToMissing` where one exists,
so a module that defines `method_missing` needs nothing in an `included` block.
Then:

- `RoutingAssertions` has no `included` block and `spliceMethodMissing` is deleted;
- `TestFixtures`' `included` block holds only what `test_fixtures.rb:26-42` holds.

## Acceptance criteria

- No `included(null, …)` call in `testing/assertions/routing.ts`; no
  `spliceMethodMissing` export.
- `TestFixtures`' `included` block has no `Object.setPrototypeOf`.
- `RoutingAssertions#methodMissing`'s `super` arm still reaches
  `TestFixtures#methodMissing` (`boot-app-test-help.trails.test.ts`), and
  `assertions.trails.test.ts`'s method_missing test stays green.
- CLAUDE.md § "Ruby protocol methods with a different JS mechanism" rows for
  `active_record/test_fixtures.rb` and `action_dispatch/testing/assertions/routing.rb`
  still read "Proxy (proto chain)".
