---
title: "Un-skip helper_test's default-helpers and alternate-helper-dir tests and drop the global helpers-path scaffolding"
status: done
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps:
  [
    "helper-modules-are-modules-not-hashes",
    "abstract-controller-helpers-inherited-runs-default-helper-module",
    "abstract-controller-helpers-module-and-caching-instance-halves",
  ]
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8624
claim: "2026-10-07T11:33:13Z"
assignee: "unskip-helper-test-default-helpers-and-alternate-dir"
blocked-by: null
closed-reason: null
---

## Context

trails#8552 ported `vendor/rails/v8.0.2/actionpack/test/controller/helper_test.rb`
to `packages/actionpack/src/action-controller/controller/helper.test.ts`. Two of
its tests are `it.skip` with the Rails body kept, each behind a `// BLOCKED:`
line, and neither blocker's acceptance criteria name the un-skip:

- "default helpers only" (`helper_test.rb:177-180`) asserts
  `JustMeController._helpers.ancestors.reject(&:anonymous?).map(&:to_s)` is
  `%w[JustMeHelper]` and `MeTooController`'s is
  `%w[MeTooController::HelperMethods MeTooHelper JustMeHelper]`. Blocked on
  `helper-modules-are-modules-not-hashes` (helper modules are nameless plain
  objects) and `abstract-controller-helpers-inherited-runs-default-helper-module`
  (`MeTooHelper` is never included; `abstract_controller/helpers.rb:68-74`).
- "all helpers with alternate helper dir" (`helper_test.rb:207-220`) sets
  `@controller_class.helpers_path` and calls `helper :all`. Blocked on
  `abstract-controller-helpers-module-and-caching-instance-halves`:
  `all_application_helpers` is `all_helpers_from_path(helpers_path)`
  (`action_controller/metal/helpers.rb:112-121`), and trails reads module-level
  names instead of the class's `helpers_path`.

The same gap is why the file's `beforeAll` drives `HelpersPathsController`
(`helper_test.rb:53-66`) and the top-of-file `helpers_path` assignment (`:4`)
through the module-level `setHelpersPath` / `loadApplicationHelperNames`, and
registers each fixture helper constant by hand, where Rails only assigns the
class attribute and `require`s the files. The test's local `ancestors` and
`instanceMethods` walkers stand in for `Module#ancestors` /
`Module#instance_methods` for the same reason.

## Acceptance criteria

- Both tests are un-skipped and green, with their `// BLOCKED:` lines removed.
- `HelpersPathsController` and `HelpersTypoController` set only the class
  `helpersPath`, as `helper_test.rb:53-70` does; the `setHelpersPath` /
  `loadApplicationHelperNames` save-and-restore in `beforeAll` / `afterAll` is
  gone.
- The hand-written `helperConstants` registration map is gone: a fixture helper
  module is a named module, registered where it is defined.
- `ancestors` / `instanceMethods` in the test are the ruby-compat `Module`
  readers, not prototype-chain walks.
