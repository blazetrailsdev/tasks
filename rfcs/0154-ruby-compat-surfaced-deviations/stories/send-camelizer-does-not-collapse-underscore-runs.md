---
title: "ruby-compat: send's predicate/writer camelizer does not collapse a run of underscores"
status: draft
updated: 2026-10-03
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

`camelized` in `packages/ruby-compat/src/object.ts` (the spelling `sendInternal` gives a sent
predicate `foo_bar?` and `writerSpelling` gives a sent writer `foo_bar=`) upcases the one character
after each underscore: `name.replace(/_([a-zA-Z\d])/g, …)`. A run of underscores is not collapsed, so
`a__b=` is looked up as `setA_B`, where `docs/ruby-ts-conventions.md:54-56` collapses the run, and
where Rails' `camelize` (`vendor/rails/v8.0.2/activesupport/lib/active_support/inflector/methods.rb:80`,
`/(?:_|(\/))([a-z\d]*)/i`) consumes each underscore in turn. Noted by the reviewer on trails PR 8455.
No Rails-derived name hits it today.

## Acceptance criteria

- [ ] `camelized` produces the spelling `scripts/parity/conventions.ts` produces for the same Ruby name, including a run of underscores, with an `object.trails.test.ts` case for `rbFSend` and `rbObjRespondTo`.
- [ ] `pnpm parity:api:calls:ruby-compat` and `pnpm parity:api:extra:gate` stay green.
