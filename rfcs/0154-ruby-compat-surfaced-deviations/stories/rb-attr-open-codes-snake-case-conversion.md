---
title: "rbAttr open-codes a snake_case conversion at each site"
status: draft
updated: 2026-10-06
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
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

Named in `thor-reserved-word-check-open-codes-underscore` (trails#8570 converged the Thor half).
`rbAttr` and the ivar-name helper beside it in `packages/ruby-compat/src/object.ts` turn a camelCase
member name into its Ruby ivar spelling with an inline
`replace(/[A-Z]/g, (c) => "_" + c.toLowerCase())`. That is an open-coded snake_case conversion repeated
at each site; MRI's `rb_attr` (`vendor/ruby/v3.3.11/vm_method.c`, `rb_attr`) takes the id as written and
makes no such call.

## Acceptance criteria

- [ ] The conversion lives in one named ruby-compat function, receipted, that both sites call; or the
      callers hand in the Ruby spelling and the conversion is gone.
- [ ] No inline `replace(/[A-Z]/g, ...)` remains in `object.ts`.
