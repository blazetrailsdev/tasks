---
title: "TestRequest#assign_parameters stringifies path parameters instead of calling to_param"
status: draft
updated: 2026-10-01
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
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

`ActionController::TestRequest#assign_parameters`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:92-104`)
converts each path parameter with `to_param`:

```ruby
if value.is_a?(Array)
  value = value.map(&:to_param)
else
  value = value.to_param
end

path_parameters[key.to_sym] = value
```

trails' `assignParameters`
(`packages/actionpack/src/action-controller/test-case.ts`, the
`pathParameters[key] = ...` arms) uses `String(v ?? "")`. That turns `nil`
into `""` where `nil.to_param` is `nil`, stringifies `true` where
`true.to_param` is `true`, and ignores a value's own `to_param` (a model's id,
an object defining `toParam`). trails#8322 converged the three `to_query`
sites in the same method; this arm was left.

## Acceptance criteria

- Both arms call `toParam` from `@blazetrails/activesupport`, as
  `test_case.rb:96-100` does, and the `pathParameters` type admits what
  `to_param` returns.
- A test passes an object with `toParam` as a path parameter (`:id`) and reads
  its `to_param` value from `request.pathParameters`.
