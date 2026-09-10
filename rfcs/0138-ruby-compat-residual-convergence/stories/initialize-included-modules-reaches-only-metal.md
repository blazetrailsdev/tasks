---
title: "initializeIncludedModules is called only from ActionController::Metal"
status: done
updated: 2026-09-07
rfc: "0138-ruby-compat-residual-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: 4
pr: trails#7590
claim: "2026-09-07T11:36:50Z"
assignee: "initialize-included-modules-reaches-only-metal"
blocked-by: null
closed-reason: null
---

## Context

`initializeIncludedModules(instance)` (`packages/ruby-compat/src/include.ts`,
added by PR #7561) is the TS stand-in for the `super` call that reaches a
module's `initialize` in Ruby's ancestry. It only runs where a class actually
calls it, and today exactly one class does: `ActionController::Metal`'s
constructor (`packages/actionpack/src/action-controller/metal.ts`), the port of
`metal.rb:210-217`.

Every other class root a mixin can be included into — `ActiveRecord::Base` /
`ActiveModel` (`activemodel/lib/active_model/model.rb:110`'s
`def initialize(attributes = {})`), `ActionView::Base`
(`actionview/lib/action_view/base.rb:229`), `AbstractController::Base` — has no
such call, so a module included there whose Ruby counterpart defines
`initialize` seats nothing and fails silently rather than loudly. That is a
trap for the next port that reaches for the hook.

## Converged shape

Audit the class roots whose Ruby `initialize` calls `super` into a mixin-bearing
ancestry and add the `initializeIncludedModules(this)` call to each, at the
point their Ruby counterpart calls `super`. Where a root genuinely cannot be
reached (no constructor to hook), record which and why.

## Acceptance criteria

- Each audited root's constructor calls `initializeIncludedModules(this)` at
  the Ruby `super` site, cited `gem/path.rb:LINE`.
- A test per root proves a module's `[initialize]` seats an own property on a
  fresh instance.
