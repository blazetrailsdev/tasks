---
title: "deprecation-raise-behavior-raises-deprecationexception"
status: done
updated: 2026-08-14
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6524
claim: "2026-08-14T14:47:03Z"
assignee: "deprecation-raise-behavior-raises-deprecationexception"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #6279.

`ActiveSupport::Deprecation`'s `:raise` behavior raises `DeprecationException`
(`activesupport/lib/active_support/deprecation/behaviors.rb:8`, raised at
`:15`). trails spells the class `DeprecationError`
(`packages/activesupport/src/deprecation.ts`), which predates PR #6279 and is
what its ported `DEFAULT_BEHAVIORS` `raise` entry throws.

The name is exported from `packages/activesupport/src/index.ts` and asserted by
`deprecation.test.ts` and `hwia-module-string.test.ts`, so the rename is
mechanical but wide.

## Acceptance criteria

- [ ] The class is named `DeprecationException`, as `behaviors.rb:8` names it.
- [ ] Every import site and assertion follows; no `DeprecationError` alias is
      left behind.
