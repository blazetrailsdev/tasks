---
title: "base-static-compiled-method-container-converge"
status: done
updated: 2026-10-23
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9277
claim: "2026-10-23T18:47:27Z"
assignee: "actionview-test-fixtures-under-test-fixtures"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionview/src/base.ts` defines `static compiledMethodContainer()` on `Base`, which throws a bare `Error`. Rails' `ActionView::Base` has no class-level `compiled_method_container`. The only singleton definition is the one `with_empty_template_cache` installs on the subclass it builds (`vendor/rails/v8.0.2/actionview/lib/action_view/base.rb:204-205`). `changed?` (`base.rb:213-215`) reaches it only on such a subclass. The instance method is already the Rails `NotImplementedError` raise (`base.rb:284-290`, trails#9272).

## Acceptance criteria

- [ ] `Base` has no static `compiledMethodContainer`. Only the subclass that `withEmptyTemplateCache` builds defines one.
- [ ] `Base.isChanged` type-checks without the base static and matches `base.rb:213-215`.
- [ ] `base.test.ts`'s `Base.compiledMethodContainer()` assertion is removed or moved to the Rails behaviour.
