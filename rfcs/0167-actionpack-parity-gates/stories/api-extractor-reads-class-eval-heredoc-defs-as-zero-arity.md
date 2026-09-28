---
title: "Read the parameters of a def inside a class_eval heredoc"
status: draft
updated: 2026-09-27
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
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

`ActionController::LogSubscriber` defines four methods through a heredoc:

```ruby
%w(write_fragment read_fragment exist_fragment? expire_fragment).each do |method|
  class_eval <<-METHOD, __FILE__, __LINE__ + 1
    def #{method}(event)
```

(`vendor/rails/v8.0.2/actionpack/lib/action_controller/log_subscriber.rb:77-88`).
`scripts/api-compare/output/rails-api.json` records `exist_fragment?` with
`"params": []` and `"notes": "class_eval"`, so `pnpm parity:api --arity`
reports trails' `isExistFragment(event)`
(`packages/actionpack/src/action-controller/log-subscriber.ts`) as an arity
mismatch.

## Acceptance criteria

- The extractor parses the parameter list of a `def` inside a `class_eval`
  heredoc, interpolated method name and all, and records `(event)`.
- A `scripts/` test pins the case.
- `pnpm parity:api --arity` reports no `log_subscriber.rb` row; any other row
  that appears or disappears across packages is listed in the PR.
