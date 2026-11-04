---
title: "rackup: port the rest of Rackup::Server and spec_server.rb"
status: in-progress
updated: 2026-11-04
rfc: "0217-rackup-gem-port"
cluster: port
packages: ["rackup"]
deps: ["port-rackup-server-for-rails-server", "rackup-package-parity-enrollment"]
deps-rfc: []
est-loc: 600
priority: null
pr: trails#9693
claim: "2026-11-03T23:48:19Z"
assignee: "rackup-lobster-and-bin-rackup"
blocked-by: null
closed-reason: null
---

## Context

`port-rackup-server-for-rails-server` ports `Rackup::Server` enough for
`Rails::Server` to extend it. This story owns every `server.rb` method and
`spec_server.rb` test that PR did not land. The rest of rackup 2.2.1 `lib/rackup/server.rb`:
`Options#parse!` (`:24-141`) and `#handler_opts` (`:143-179`); `start`'s
`warn` / `include` / `require` / `debug` arms (`:300-342`);
`handle_profiling` / `make_profile_name` (`:357-393`);
`daemonize_app`, `write_pid`, `check_pid!`, `exit_with_pid` (`:427-460`).

The RFC's § Design decides the two runtime gaps: `daemonize_app` and the
profiling methods are ported as written, and six tests are `PERMANENT-SKIP`.

## Acceptance criteria

- [ ] Every method of `server.rb` is ported at its Rails
      position; the pid-file arms (`spec_server.rb:531-600`) pass on real files.
- [ ] Every `it` of `spec_server.rb` is ported by name; `:125`, `:134`,
      `:148`, `:368`, `:390` and `:412` are `it.skip` under a `PERMANENT-SKIP:`
      line citing CLAUDE.md § "Runtime facts Node does not expose" (daemonize)
      or the RFC's § Design (profiling).
- [ ] `pnpm parity:api:calls` and `parity:api:calls:args` show no new
      `rackup/server.ts` row.
