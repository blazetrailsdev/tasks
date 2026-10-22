---
title: "Tags::Base#retrieve_autoindex: every object answers to_param"
status: claimed
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-10-22T18:53:35Z"
assignee: "included-mixins-overridable-beyond-conversion"
blocked-by: null
closed-reason: null
---

## Context

`Tags::Base#retrieve_autoindex`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/tags/base.rb:74-81`)
checks `object.respond_to?(:to_param)`, which is true for every Ruby object
because ActiveSupport defines `Object#to_param` as `to_s`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/to_query.rb`).
trails' `retrieveAutoindex` (`packages/actionview/src/helpers/tags/base.ts:117-130`)
requires an own `toParam` member, so a plain Struct raises
`ArgumentError: object[] naming but object param ...`. trails#9173 had to set
`view.album.toParam` by hand in `select with index option`
(`packages/actionview/src/template/form-options-helper.test.ts`) to get past it.

Converged shape: the respond_to arm answers true for any non-nil object, and
the value comes from activesupport's `toParam(value)` (`packages/activesupport/src/hash-utils.ts:435`),
the port of `Object#to_param`, which dispatches to an own `toParam` first.

## Acceptance criteria

- `retrieveAutoindex` reads `to_param` through the Object#to_param port.
- The `view.album.toParam` assignment in `select with index option` is removed and the test passes.
