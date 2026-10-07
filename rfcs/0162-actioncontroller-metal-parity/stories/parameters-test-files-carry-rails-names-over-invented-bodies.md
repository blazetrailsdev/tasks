---
title: "controller/parameters tests carry Rails names over invented bodies"
status: in-progress
updated: 2026-10-07
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#8617
claim: "2026-10-07T09:03:10Z"
assignee: "parameters-test-files-carry-rails-names-over-invented-bodies"
blocked-by: null
closed-reason: null
---

## Context

The files under
`packages/actionpack/src/action-controller/controller/parameters/` carry the
Rails test names, so `parity:test` matches them, but most bodies are not the
Rails bodies. They build a one-off `new Parameters({ a: "1" })` where
`vendor/rails/v8.0.2/actionpack/test/controller/parameters/*_test.rb` builds
the shared `@params` in `setup` (a `person` hash with `age`, `name` and
`addresses`), and assert something simpler than Rails asserts.

trails#8563 rewrote `dup.test.ts` and `serialization.test.ts` from
`dup_test.rb` and `serialization_test.rb`, and only renamed call sites in the
rest: `accessors.test.ts`, `equality.test.ts`, `mutators.test.ts`,
`mass-assignment-empty.test.ts`, `nested-parameters-permit.test.ts`,
`parameters-expect.test.ts`, `parameters-permit.test.ts`.

## Acceptance criteria

- [ ] Each listed file is rewritten from its Rails counterpart: the same
      `setup` fixture, the same statements and the same assertions per test.
- [ ] A test whose Rails assertions fail against the port is parked `it.skip`
      under a `BLOCKED:` line naming a filed story, with the Rails body kept.
- [ ] `pnpm parity:test:assertions` stays green and the actioncontroller
      assertion marks are tightened.
