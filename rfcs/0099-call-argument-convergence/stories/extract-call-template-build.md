---
title: "extract-call-template-build"
status: done
updated: 2026-08-16
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6585
claim: "2026-08-15T23:28:17Z"
assignee: "extract-call-template-build"
blocked-by: null
closed-reason: null
---

# Extract `CallTemplate.build` in activesupport/callbacks.ts instead of inlining its dispatch

## Context

Surfaced while converging RFC 0099's `kind: "args"` rows (PR for
`converge-constructor-argument-rows`). The row

    activesupport | callbacks.ts | compiled | new

could not be converged and now carries a reviewed reason instead.

`vendor/rails/activesupport/lib/active_support/callbacks.rb:281-293`:

    def compiled
      @compiled ||=
        begin
          user_conditions = conditions_lambdas
          user_callback = CallTemplate.build(@filter, self)
          case kind
          when :before then Filters::Before.new(user_callback.make_lambda, user_conditions, chain_config, @filter, name)
          ...

`CallTemplate.build` (callbacks.rb, `class CallTemplate` section) is a factory
that picks `InstanceExec0/1/2`, `ObjectCall`, `MethodCall` or `ProcCall` from
the filter. trails inlines that whole dispatch into the `compiled` getter
(`packages/activesupport/src/callbacks.ts:660-691`), so the body constructs
five template classes Rails' body never mentions and the `Filters::*`
constructions no longer line up positionally with Rails'.

CLAUDE.md: "If Rails extracts a private helper, extract it, with the Rails
name."

## Acceptance criteria

- [ ] A `static build(filter, callback)` on `CallTemplate` carries the dispatch,
      matching Rails' branch order and guards (including the String arm that
      raises).
- [ ] `compiled` reads `const userCallback = CallTemplate.build(this.filter, this)`.
- [ ] The `compiled -> new` row is deleted from
      `scripts/api-compare/call-mismatches-exclude/activesupport/callbacks.json`
      (delete by hand; no `--write`, no reseed).
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green; no new
      `pnpm parity:api:extra` surface.
