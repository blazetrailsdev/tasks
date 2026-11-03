---
title: "rackup: port Rackup::Lobster and bin/rackup"
status: ready
updated: 2026-11-03
rfc: "0217-rackup-gem-port"
cluster: port
packages: ["rackup"]
deps: ["rackup-package-parity-enrollment"]
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

`Rackup::Lobster` (rackup 2.2.1 `lib/rackup/lobster.rb:14-81`) is the demo
app `rackup` serves with no `config.ru`: `LobsterString`, `LambdaLobster`, and
`#call` with its `flip` and `crash` query arms. `bin/rackup` (`:1-5`) is
`Rackup::Server.start`. `test/spec_lobster.rb` has 6 tests, through
`Rack::MockRequest` and `Rack::Lint`.

## Acceptance criteria

- [ ] `packages/rackup/src/lobster.ts` ports `Lobster`, `LobsterString` and
      `LambdaLobster`.
- [ ] `packages/rackup` ships a `rackup` bin entry that calls `Server.start`.
- [ ] All 6 `spec_lobster.rb` tests ported by name.
