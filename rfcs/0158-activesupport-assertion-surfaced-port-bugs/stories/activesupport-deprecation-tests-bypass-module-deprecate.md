---
title: "deprecation tests call deprecateMethods where Rails calls Module#deprecate"
status: draft
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8018 ported `Module#deprecate` (`vendor/rails/activesupport/lib/active_support/core_ext/module/deprecation.rb:23-25`) as `packages/activesupport/src/core-ext/module/deprecation.ts` and converged four `Module::deprecate` tests onto `klass.deprecate(...)`. The rest of `packages/activesupport/src/deprecation.test.ts` still calls `deprecator.deprecateMethods(klass.prototype, ...)` directly, where Rails goes through `deprecate`:

- `Module::deprecate with alternative method` / `with message`: Rails uses `deprecate_methods` here, so check `deprecation_test.rb` before changing them.
- `Module::deprecate with custom deprecator` (`deprecation_test.rb:505-530`): the class body calls `deprecate :method, deprecator: deprecator` (`:511`) and `deprecate :method, deprecator: custom_deprecator` (`:525`). trails' test calls `deprecator.deprecateMethods(deprecatee.prototype, ...)` (around `deprecation.test.ts:787`). The `:525` arm (a non-`Deprecation` deprecator) is the `elsif deprecator` branch of `deprecation.rb:19-22`, and no test covers it yet.

## Acceptance criteria

- Every test whose Rails body calls `deprecate` does so through `static deprecate = deprecate` on the test class.
- The custom-deprecator test covers `deprecation.rb:19-22`'s non-`Deprecation` branch.
- Test names are unchanged, and the assertion ratchet stays green.
