---
title: "Port ActionController::Helpers#helper_attr"
status: draft
updated: 2026-09-06
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Helpers::ClassMethods#helper_attr`
(`vendor/rails/actionpack/lib/action_controller/metal/helpers.rb:83-85`) is not
ported:

```ruby
def helper_attr(*attrs)
  attrs.flatten.each { |attr| helper_method(attr, "#{attr}=") }
end
```

Found while porting the rest of that file in blazetrailsdev/trails#7558, which
landed `helpersPath`, `includeAllHelpers`, the `modulesForHelpers` `:all` arm
and `allApplicationHelpers` but left this member out of scope.

`helperMethod` — the thing it delegates to — is already ported at
`packages/actionpack/src/abstract-controller/helpers.ts` (`helperMethod(cls,
...names)`), including the nested-array flattening Ruby's `attrs.flatten` does,
so this is a thin wrapper over machinery that already exists.

Rails covers it with `test_helper_attr`
(`vendor/rails/actionpack/test/controller/helper_test.rb:161-169`).

## Converged shape

`helperAttr(cls, ...attrs)` in
`packages/actionpack/src/action-controller/metal/helpers.ts`, flattening its
arguments and calling `helperMethod` with the attribute and its writer name for each. The
writer name is the open question: trails spells a Ruby `x=` writer as `setX()`
(CLAUDE.md, "Fidelity is the job"), so `"#{attr}="` should become the trails
writer spelling for the attribute rather than a literal `foo=` key — decide
that against how `helperMethod` proxies are read from a template and record the
choice at the call site.

## Acceptance criteria

- `helperAttr` exists at the Rails file path and name, exported from the
  actionpack `ActionController` namespace.
- `test_helper_attr` is ported under its Rails name, asserting both the reader
  and the writer reach the view.
- The writer's TS spelling is decided and consistent with `helperMethod`'s
  existing proxies.
