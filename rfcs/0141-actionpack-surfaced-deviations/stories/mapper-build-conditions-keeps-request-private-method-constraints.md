---
title: 'Mapping#build_conditions keeps a constraint named after a private Request method (public_method_defined? reads "defined")'
status: draft
updated: 2026-10-01
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8317, which retired ruby-compat's run-time visibility table (CLAUDE.md §
"Method visibility is compile-time only").

Rails' `Mapping#build_conditions`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb:198-204`) is

```ruby
conditions.keep_if do |k, _|
  request_class.public_method_defined?(k)
end
```

so a constraint named after one of `ActionDispatch::Request`'s private methods —
`check_method`, `default_session`, `read_body_stream`, `reset_stream`,
`fallback_request_parameters` (`action_dispatch/http/request.rb:496-540`) — is dropped
and never becomes a route condition.

trails' port (`packages/actionpack/src/action-dispatch/routing/mapper.ts`, `buildConditions`)
calls `rbModPublicMethodDefined(requestClass, k)`, which now answers "defined": a JS method
entry carries no visibility. Those five names are TS-`protected` members of `Request`
(`packages/actionpack/src/action-dispatch/http/request.ts`), so a constraint keyed
`checkMethod` / `defaultSession` / `readBodyStream` / `resetStream` /
`fallbackRequestParameters` is KEPT as a condition where Rails drops it.
`packages/actionpack/src/action-dispatch/routing/mapper.trails.test.ts`
("keeps a constraint naming a Rails-private Request method") pins the divergent behaviour.

The new CLAUDE.md section rules out a general visibility carrier and says code whose Rails
body branches on visibility "needs an explicit mechanism decided per class". This is that
decision for `build_conditions`.

## Acceptance criteria

- [ ] Decide the per-class mechanism by which `buildConditions` tells `Request`'s public
      methods from its Rails-private ones, without a general run-time visibility table and
      without `#private` members (CLAUDE.md § "Method visibility is compile-time only").
      If no mechanism is acceptable, `pnpm tasks block` with that finding.
- [ ] A constraint keyed by any of the five names above is dropped from `route.conditions`,
      as `mapper.rb:201-203` drops it.
- [ ] The pinning test in `mapper.trails.test.ts` is replaced by one asserting the name is
      NOT a condition.
- [ ] `rbModPublicMethodDefined`'s signature and its "defined" answer for every other class
      are unchanged.
