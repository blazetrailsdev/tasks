---
title: "helper_test's skipped tests name closed stories; default helpers only needs Module#ancestors"
status: done
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8624
claim: "2026-10-07T17:33:12Z"
assignee: "helper-test-blocked-markers-name-closed-stories-and-module-ancestors"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/controller/helper.test.ts` carries two
`it.skip` tests whose `BLOCKED:` lines name stories that are closed.

- `all helpers with alternate helper dir`
  (`vendor/rails/v8.0.2/actionpack/test/controller/helper_test.rb:210-223`) is
  marked `BLOCKED: abstract-controller-helpers-module-and-caching-instance-halves`,
  which trails#8574 closed. The re-point was lost in that PR's rebase onto
  trails#8577. Its real blocker is `all_application_helpers` reading the
  ahead-of-time scan, tracked by
  `action-controller-helpers-all-application-helpers-and-helper-method-accessor-arm`.
- `default helpers only` (`helper_test.rb:187-192`) is marked
  `BLOCKED: abstract-controller-helpers-inherited-runs-default-helper-module`,
  which is done. Rails asserts
  `JustMeController._helpers.ancestors.reject(&:anonymous?)`. The test's local
  `ancestors` helper walks a plain object's prototype chain, but `_helpers` is a
  ruby-compat `Module` now, and `Module` (`packages/ruby-compat/src/include.ts`)
  has no `ancestors`. `rbModAncestors` there takes a class, not a `Module`
  instance. Ruby's is `rb_mod_ancestors`, `vendor/ruby/v3.3.11/class.c:1561`.

## Acceptance criteria

- `all helpers with alternate helper dir`'s `BLOCKED:` line names the live story.
- `Module#ancestors` answers a `Module` instance's own carrier followed by the
  modules it includes, nested ones included, and `default helpers only` runs
  unskipped with Rails' two assertions.
- No `BLOCKED:` line in the file names a closed story.
