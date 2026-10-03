---
title: "actionview: port abstract_controller_test.rb's two local_prefixes tests under their Rails names (abstract_controller_test.rb:165-195)"
status: draft
updated: 2026-10-03
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionview", "actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionview/test/actionpack/abstract/abstract_controller_test.rb:165-195` tests the hook trails#8450 made work:

- `OverridingLocalPrefixesTest` "overriding .local_prefixes adds prefix" — `OverridingLocalPrefixes < AbstractController::Base`, including `AbstractController::Rendering` and `ActionView::Rendering`, overrides `self.local_prefixes` as `super + ["abstract_controller/testing/me3"]`, and `process(:index)` renders `views/abstract_controller/testing/me3/index.erb` ("Hello from me3/index.erb").
- ".local_prefixes is inherited" — the same through `OverridingLocalPrefixes::Inheriting`.

Neither is ported: the whole file has no trails counterpart (`packages/actionview/src/actionpack/` holds only `controller/`). trails#8450 covered the behaviour in `view-paths.trails.test.ts` and `action-controller/base.trails.test.ts` under trails-only names, because the Rails cases need an `AbstractController::Base` host that includes the two `Rendering` modules and renders a real template from a fixture directory.

## Converged shape

`packages/actionview/src/actionpack/abstract/abstract-controller.test.ts` carries the two tests under their Rails names, on an `AbstractController::Base` subclass that includes `AbstractController::Rendering` and `ActionView::Rendering`, with the `me3` fixture. The trails-only duplicates are deleted where the Rails-named tests subsume them.

## Acceptance criteria

- [ ] Both Rails test names exist verbatim and pass; `pnpm test:compare` credits them.
- [ ] The host is an `AbstractController::Base` subclass, not `ActionController::Base`.
- [ ] Any trails gap found standing the host up is filed, not worked around.
