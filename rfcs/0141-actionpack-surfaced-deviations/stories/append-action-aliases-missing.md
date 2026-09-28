---
title: "append_before_action / append_after_action / append_around_action aliases are missing"
status: done
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8203
claim: "2026-09-27T23:57:35Z"
assignee: "abstract-normalize-render-self-dispatches-process-variant"
blocked-by: null
closed-reason: null
---

## Context

Rails defines `append_before_action`, `append_after_action` and `append_around_action` as aliases of the plain forms:

```ruby
alias_method :"append_#{callback}_action", :"#{callback}_action"
```

(`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/callbacks.rb:249`)

trails#8143 added the `prepend*Action` forms to `packages/actionpack/src/abstract-controller/callbacks.ts` and the matching statics on `abstract-controller/base.ts`. The `append*` aliases are still missing.

## Converged shape

Add `static appendBeforeAction = beforeAction` (and the same for after and around) on `AbstractController` in `abstract-controller/base.ts`, next to the `prepend*` statics. These are aliases, not new functions.

## Acceptance criteria

- `AbstractController.appendBeforeAction === AbstractController.beforeAction`, and the same for after and around.
- If `filters_test.rb` uses the `append_*` form, its test is ported.
