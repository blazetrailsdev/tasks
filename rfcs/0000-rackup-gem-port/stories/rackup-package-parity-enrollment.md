---
title: "rackup: enroll @blazetrails/rackup in the parity gates"
status: ready
updated: 2026-11-03
rfc: "0000-rackup-gem-port"
cluster: fidelity
packages: ["rackup", "scripts"]
deps: ["port-rackup-server-for-rails-server"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The in-flight `port-rackup-server-for-rails-server` commits only to
`Rails::Server` extending a port of `Rackup::Server`. This story owns the rest
of the package's foundation, keeping whatever that PR already landed:
`packages/rackup` with its registrations (`tsconfig.json`, `vitest.config.ts`,
`.github/workflows/ci.yml`, `scripts/ci-suite-coverage.test.ts`), rackup
2.2.1 vendored at `vendor/rackup/v2.2.1/` with its `test/` tree
(`vendor/sources.ts`; the gem ships no tests, so the source is the v2.2.1
tag), `lib/rackup.rb`, `lib/rackup/version.rb`, and `Rackup::Handler`
(`lib/rackup/handler.rb:14-112`: `register`, `[]`, `get`, `pick`, `default`,
`require_handler`).

The parity machinery has to see the new
package the way it sees `rack-session`, `rack-test` and `rake`: the gem's
`lib/rackup/` tree mapped in `scripts/parity/conventions.ts`, the gem's
`test/spec_*.rb` in the test-compare population, and a row in
`scripts/api-compare/extra-surface-mark.json`.

## Acceptance criteria

- [ ] `packages/rackup`, the vendor entry, `version.ts`, `index.ts` and
      `handler.ts` exist on main, each method of `handler.rb` at its Rackup
      name, with `spec_handler.rb`'s 6 tests ported by name.

- [ ] `pnpm parity:api --package rackup` and `pnpm parity:test --package rackup`
      report `vendor/rackup/v2.2.1/lib/rackup/*.rb` and `test/spec_*.rb`.
- [ ] `rackup` is in the extra-surface gate (pinned or rowless if its novel
      surface is 0), and in every enumerating guard a new package needs
      (`scripts/ci-suite-coverage.test.ts`, ci.yml) not already added by the
      package's first PR.
- [ ] `handler/webrick.rb` and `handler/cgi.rb` are recorded unported with a
      reason citing this RFC's Non-goals.
