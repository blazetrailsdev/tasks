---
title: "rackup-server-write-pid-removes-pidfile-at-exit"
status: draft
updated: 2026-11-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rackup::Server#write_pid` (`vendor/rackup/v2.2.1/lib/rackup/server.rb:440-446`) registers `at_exit { ::FileUtils.rm_f(options[:pid]) }`. ruby-compat has no `Kernel#at_exit` (`rb_f_at_exit`, `vendor/ruby/v3.3.11/eval_jump.c:42`), so `packages/rackup/src/server.ts` `writePid` carries `@missingRailsCall at_exit — CONVERGEABLE rackup-server-write-pid-removes-pidfile-at-exit`, and a pid file outlives the server.

## Acceptance criteria

- [ ] ruby-compat ports `at_exit` over the process adapter's exit hook.
- [ ] `writePid` calls it with `FileUtils.rmF(options.pid)`, and the receipt is gone.
