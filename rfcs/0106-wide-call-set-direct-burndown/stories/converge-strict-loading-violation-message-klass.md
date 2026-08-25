---
title: "converge-strict-loading-violation-message-klass"
status: done
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6825
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# `Reflection#strict_loading_violation_message` interpolates `className`, not `klass`

## Context

Surfaced by the leading-underscore call candidate (PR #6825).

Rails (`activerecord/lib/active_record/reflection.rb:344-348`):

```ruby
def strict_loading_violation_message(owner)
  message = +"`#{owner}` is marked for strict_loading."
  message << " The #{polymorphic? ? "polymorphic association" : "#{klass} association"}"
  message << " named `:#{name}` cannot be lazily loaded."
end
```

trails splits this into a module function
(`packages/activerecord/src/reflection.ts:102-115`) taking a pre-built
`{ name, polymorphic, className }` and a class method (`:503-508`) that fills it
in. Because the object is built eagerly, the port cannot resolve `klass` the way
Rails does — inside the non-polymorphic arm only — without raising on a
polymorphic reflection, where Rails never touches it. So it interpolates
`className` instead.

Converging means collapsing the free-function / class-method split so one Rails
method is one TS method, which is the actual defect here; the missing `klass`
call is a symptom.

Baselined meanwhile in
`scripts/api-compare/call-mismatches-exclude/activerecord/reflection.json`.

## Acceptance criteria

- [ ] One TS method carrying Rails' body, resolving `klass` lazily in the
      non-polymorphic arm only.
- [ ] The baseline row is deleted and the shard mark tightened.
