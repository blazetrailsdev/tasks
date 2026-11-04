---
title: "rackup: enroll @blazetrails/rackup in the parity gates"
status: done
updated: 2026-11-03
rfc: "0217-rackup-gem-port"
cluster: fidelity
packages: ["rackup", "scripts"]
deps: ["port-rackup-server-for-rails-server"]
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9685
claim: "2026-11-03T22:19:38Z"
assignee: "rackup-package-parity-enrollment"
blocked-by: null
closed-reason: null
---

## Context

`port-rackup-server-for-rails-server` commits to the `vendor/sources.ts`
entry, `Rackup::Handler` and `Rackup::Server` with `Options`. This story owns
the rest of the package's foundation, keeping whatever that PR already landed:
`packages/rackup`'s registrations (`tsconfig.json`, `vitest.config.ts`,
`.github/workflows/ci.yml`, `scripts/ci-suite-coverage.test.ts`), the
vendored `test/` tree (the gem ships no tests, so the source is the v2.2.1
tag), `lib/rackup.rb`, `lib/rackup/version.rb`, and the `spec_handler.rb`
tests that PR did not port.

The parity machinery has to see the new
package the way it sees `rack-session`, `rack-test` and `rake`: the gem's
`lib/rackup/` tree mapped in `scripts/parity/conventions.ts`, the gem's
`test/spec_*.rb` in the test-compare population, and a row in
`scripts/api-compare/extra-surface-mark.json`.

## Acceptance criteria

- [ ] `version.ts` and `index.ts` mirror `version.rb` and `rackup.rb`, the
      vendored tree includes `test/`, and all 6 `spec_handler.rb` tests are
      ported by name.
- [ ] `pnpm parity:api --package rackup` and `pnpm parity:test --package rackup`
      report `vendor/rackup/v2.2.1/lib/rackup/*.rb` and `test/spec_*.rb`.
- [ ] `rackup` is in the extra-surface gate (pinned or rowless if its novel
      surface is 0), and in every enumerating guard a new package needs
      (`scripts/ci-suite-coverage.test.ts`, ci.yml) not already added by the
      package's first PR.
- [ ] `handler/webrick.rb` and `handler/cgi.rb` are recorded unported with a
      reason citing this RFC's Non-goals.
