---
title: "rackup: enroll @blazetrails/rackup in the parity gates"
status: ready
updated: 2026-11-03
rfc: "0000-rackup-gem-port"
cluster: null
packages: ["rackup", "scripts"]
deps: ["port-rackup-server-for-rails-server"]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-rackup-server-for-rails-server` creates `packages/rackup` and vendors
rackup 2.2.1 (`vendor/sources.ts`). The parity machinery has to see the new
package the way it sees `rack-session`, `rack-test` and `rake`: the gem's
`lib/rackup/` tree mapped in `scripts/parity/conventions.ts`, the gem's
`test/spec_*.rb` in the test-compare population, and a row in
`scripts/api-compare/extra-surface-mark.json`.

## Acceptance criteria

- [ ] `pnpm parity:api --package rackup` and `pnpm parity:test --package rackup`
      report `vendor/rackup/v2.2.1/lib/rackup/*.rb` and `test/spec_*.rb`.
- [ ] `rackup` is in the extra-surface gate (pinned or rowless if its novel
      surface is 0), and in every enumerating guard a new package needs
      (`scripts/ci-suite-coverage.test.ts`, ci.yml) not already added by the
      package's first PR.
- [ ] `handler/webrick.rb` and `handler/cgi.rb` are recorded unported with a
      reason citing this RFC's Non-goals.
