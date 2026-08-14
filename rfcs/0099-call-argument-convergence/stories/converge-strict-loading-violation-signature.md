---
title: "converge-strict-loading-violation-signature"
status: done
updated: 2026-08-14
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6499
claim: "2026-08-13T23:57:08Z"
assignee: "converge-strict-loading-violation-signature"
blocked-by: null
closed-reason: null
---

# Converge `strict_loading_violation!` to Rails' kwarg signature

## Context

Residual from `call-args-ar-kwarg-values`. One RFC 0095 `kind: "args"` row in
`scripts/api-compare/call-mismatches-exclude/activerecord/core.json`
(`strict_loading_violation!` → `instrument`) flags
`(str:strict_loading_violation.active_record, kwargs{owner=ref:ownerClass,reflection=ref:reflectionLike})`
against Rails' `(ref:name, kwargs{owner=ref:owner,reflection=ref:reflection})`.

Rails (`vendor/rails/activerecord/lib/active_record/core.rb:253-262`):

```ruby
def self.strict_loading_violation!(owner:, reflection:)
  case ActiveRecord.action_on_strict_loading_violation
  when :raise
    message = reflection.strict_loading_violation_message(owner)
    raise ActiveRecord::StrictLoadingViolationError.new(message)
  when :log
    name = "strict_loading_violation.active_record"
    ActiveSupport::Notifications.instrument(name, owner: owner, reflection: reflection)
  end
end
```

trails (`packages/activerecord/src/core.ts:693-718`) takes POSITIONAL
`(owner, reflection: string, options)`, synthesizes a `reflectionLike` object
and an `ownerClass`, hoists no `name` local, and inverts the branch order
(`:log` arm first). The kwarg VALUES cannot converge without the signature.

## Acceptance criteria

1. `strictLoadingViolationBang` takes Rails' `{ owner, reflection }` kwargs with
   a real reflection, matching core.rb:253.
2. Branch order and the `name` local match core.rb:254-261.
3. All callers updated; the baseline row deleted by hand (only-shrink).
4. `pnpm parity:api:calls:args` green; strict-loading tests green.
