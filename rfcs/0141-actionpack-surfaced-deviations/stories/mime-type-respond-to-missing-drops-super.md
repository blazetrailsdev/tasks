---
title: "Mime::Type#respond_to_missing? drops its super arm"
status: draft
updated: 2026-10-02
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Mime::Type#respond_to_missing?`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_type.rb:344-346`)
is `method.end_with?("?") || super`. trails' `respondToMissing`
(`packages/actionpack/src/action-dispatch/http/mime-type.ts`, the `Type` class,
around `:267`) returns `method.endsWith("?")` and drops the `super` arm.

`Type` has no TS superclass to say `super` to, and no ancestor defines
`respond_to_missing?`, so the arm is MRI's default. trails#8410 added that
default to ruby-compat as `objRespondToMissing`
(`obj_respond_to_missing`, `vendor/ruby/v3.3.11/vm_method.c:3009`) and used it
for `RoutesProxy#respond_to_missing?` (`routes_proxy.rb:26-28`); `Mime::Type`
is the same shape and was left alone.

`Mime::NullType#respond_to_missing?` (`mime_type.rb:379-381`) has no `super`
and is already faithful.

## Acceptance criteria

- `Type#respondToMissing` is
  `method.endsWith("?") || objRespondToMissing(this, method, includePrivate)`,
  in Rails' operand order, with Rails' parameter name `includePrivate`.
- `packages/ruby-compat/README.md`'s `objRespondToMissing` row lists the new
  call site.
- `mime-type.test.ts` stays green.
