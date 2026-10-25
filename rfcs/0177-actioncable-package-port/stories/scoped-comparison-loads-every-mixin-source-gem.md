---
title: "Scoped comparison loads the Rails lib of every gem a package mixes in"
status: ready
updated: 2026-10-25
rfc: "0177-actioncable-package-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/ci/scoped-comparison.sh` runs the parity gates for one package (actioncable or thor) with only that package's vendored Rails lib in `LIB_PATHS_JSON`. In that run, a Rails class that includes a module from another gem has its `include` resolve to nothing, so `extra-surface.ts`'s `collectAllowedNames` / `walkMixin` scores the `declare`d mixin members as novel. The full comparison credits them.

trails#9264 hit this with `Server::Worker` (`vendor/rails/v8.0.2/actioncable/lib/action_cable/server/worker.rb`, `include ActiveSupport::Callbacks`) and `Connection::Base` (`connection/base.rb`, `include ActiveSupport::Rescuable`). It fixed it by also loading the `activesupport` key (`$with_activesupport` in the script). That covers only activesupport. A module from any other gem, such as actionpack's `AbstractController` or `ActionDispatch` modules or ActiveModel, would hit the same false positive.

## Acceptance criteria

- [ ] The scoped run's `LIB_PATHS_JSON` holds `$pkg` plus the lib keys of every gem whose module a `$pkg` Rails file `include`s, `extend`s or `prepend`s, worked out from the package's dependencies or the Ruby manifest rather than a hard-coded `activesupport`.
- [ ] `LIB_ENTRY_FILES_JSON` and `TEST_PATHS_JSON` stay `$pkg`-only.
- [ ] `bash scripts/ci/scoped-comparison.sh actioncable` and `... thor` both exit 0.
