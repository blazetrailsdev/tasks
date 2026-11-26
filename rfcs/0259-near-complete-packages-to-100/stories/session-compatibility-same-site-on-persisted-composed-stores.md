---
title: "session-compatibility-same-site-on-persisted-composed-stores"
status: done
updated: 2026-11-26
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps:
  - actiondispatch-reaches-100
deps-rfc: []
est-loc: null
priority: null
pr: trails#10760
claim: "2026-11-25T17:13:35Z"
assignee: "activestorage-solid-queue-api-remainder"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Session::Compatibility#initialize`
(`vendor/rails/v8.0.5.2/actionpack/lib/action_dispatch/middleware/session/abstract_store.rb:22-31`)
defaults `same_site` to `DEFAULT_SAME_SITE` for any class that includes
`Compatibility`. trails inlines that body into the `AbstractStore` and
`AbstractSecureStore` constructors
(`packages/actionpack/lib/action-dispatch/middleware/session/abstract-store.ts`),
so a class built directly on `Rack::Session::Abstract::Persisted` that includes
the mixins does not get it. Per root CLAUDE.md § "A module's `initialize` is
inlined into the constructor", an open-set include is inlined behind an
`isModuleIncluded(new.target, Compatibility)` guard in the nearest constructor,
which is `Persisted`'s in `@blazetrails/rack-session`, a package that cannot
import actionpack.

Rails test: `actionpack/test/dispatch/session/abstract_store_test.rb:54-72`
"store composed from the mixins gets same site from env".

## Acceptance criteria

- [ ] A class extending `Persisted` that includes `Compatibility`, `StaleSessionCheck` and `SessionObject` gets `DEFAULT_SAME_SITE`, with no carrier `Module`.
- [ ] The Rails test is ported in `dispatch/session/abstract-store.test.ts` and passes.
