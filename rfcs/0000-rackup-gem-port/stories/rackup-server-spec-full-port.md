---
title: "rackup: port the rest of Rackup::Server and spec_server.rb"
status: ready
updated: 2026-11-03
rfc: "0000-rackup-gem-port"
cluster: null
packages: ["rackup"]
deps: ["port-rackup-server-for-rails-server"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`port-rackup-server-for-rails-server` ports `Rackup::Server` enough for
`Rails::Server` to extend it, with 15 of `spec_server.rb`'s 51 tests and 3 of
`spec_handler.rb`'s 6. The rest of rackup 2.2.1 `lib/rackup/server.rb`:
`Options#parse!` (`:24-141`) and `#handler_opts` (`:143-179`); `start`'s
`warn` / `include` / `require` / `debug` arms (`:300-342`);
`handle_profiling` / `make_profile_name` (`:357-393`);
`daemonize_app`, `write_pid`, `check_pid!`, `exit_with_pid` (`:427-460`).

`daemonize_app` calls `Process.daemon`, a fork: CLAUDE.md § "Runtime facts
Node does not expose". `--heap` / `--profile-mode` name `ObjectSpace` and
`stackprof`, which Node does not have.

## Acceptance criteria

- [ ] Every method of `server.rb` and `handler.rb` is ported at its Rails
      position; the pid-file arms (`spec_server.rb:531-600`) pass on real files.
- [ ] Every `it` of `spec_server.rb` and `spec_handler.rb` is ported by name;
      the daemonize and profiling ones that cannot run are `it.skip` under a
      `PERMANENT-SKIP:` line citing the section above, after the repo owner
      rules on profiling.
- [ ] `pnpm parity:api:calls` and `parity:api:calls:args` show no new
      `rackup/server.ts` row.
