---
title: "port-railtie-configuration-dynamic-options-test"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`railties/test/configuration/dynamic_options_test.rb` (35 lines, 3 tests) covers
`Rails::Railtie::Configuration`'s `method_missing` surface — the dynamic option
bag at `railties/lib/rails/railtie/configuration.rb:90-108`:

- `test "raises NoMethodError on an unset key"` (`:22-27`) — reading an unset key
  falls through to `super`.
- `test "raises NoMethodError with an informative message if assigning to an
existing method"` (`:29-35`) — `Cannot assign to \`eager_load_namespaces\`, it
  is a configuration method`.

The file is not enrolled in `parity:test`. PR #7386 ported the raise-on-shadow
half (`configuration.ts`'s `set` / `_actualMethod`, mirroring
`configuration.rb:95-97` and `:99-105`) and covered it in
`packages/activesupport/src/trailtie/configuration.trails.test.ts`, a trails-only
file — so the behaviour is tested but does not credit against the Rails test, and
the read-arm test is not ported at all.

Note `Railtie::Configuration` lives in `packages/activesupport/src/trailtie/`
since the fold (RFC 0112), while the Ruby test path maps to trailties; enrolling
the file needs the usual four test-compare registrations.

## Converged shape

Port the file as the Rails test names, verbatim, and enroll it in `parity:test`
so all three cases credit. The trails-only assertions in
`configuration.trails.test.ts` that duplicate a ported case move into the ported
file and out of the trails-only one.

The read arm (`config.unset_key` raising) needs `method_missing` semantics the
`get`/`set` spelling does not have: `get` on an unset key returns `undefined`
where Ruby raises `NoMethodError`. Decide there whether `get` should raise —
`configuration.rb:106-108`'s `else super` says it should.

## Acceptance criteria

- [ ] `dynamic_options_test.rb`'s three tests ported with verbatim names and
      enrolled in `parity:test` (4 registrations).
- [ ] `get` on a never-set key raises `NoMethodError`, per
      `configuration.rb:106-108`, or the deviation is recorded with a reason.
- [ ] `parity:test` totals do not regress.
