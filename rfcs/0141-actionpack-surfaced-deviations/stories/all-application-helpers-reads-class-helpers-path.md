---
title: "all-application-helpers-reads-class-helpers-path"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails keeps two `helpers_path`s. The module-level
`ActionController::Helpers.helpers_path`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/helpers.rb:66`,
set by `railtie.rb:31`) is copied into each controller class's
`class_attribute :helpers_path` (`helpers.rb:70`) by
`railties/helpers.rb:15-18`. `all_application_helpers` then reads the
**class** attribute: `all_helpers_from_path(helpers_path)`
(`helpers.rb:120-122`, in `ClassMethods`).

trails#8250 made `helpers_path` a `classAttribute` on `ActionController::Base`
(`packages/actionpack/src/action-controller/base.ts`). But
`loadApplicationHelperNames` / `allApplicationHelpers` in
`packages/actionpack/src/action-controller/metal/helpers.ts` still read the
module-level `_helpersPath` (`:9-16`, `:38`), so a per-class `helpers_path`
never reaches helper resolution. The two copies can diverge.

## Acceptance criteria

- `allApplicationHelpers` is a class method that reads the class's own
  `helpersPath`, as `helpers.rb:120-122` does. The module-level `helpersPath()` /
  `setHelpersPath()` stays only as the port of `helpers.rb:66`.
- A controller subclass with its own `helpersPath` resolves `helper :all` from
  that path.
