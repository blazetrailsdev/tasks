---
title: "TSREPL: EOF is not a forced exit; seat remaining init_config keys"
status: done
updated: 2026-11-09
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9898
claim: "2026-11-09T02:35:29Z"
assignee: "generator-base-name-generator-name-memoize"
blocked-by: null
closed-reason: null
---

## Context

trails#9856 ported IRB as TSREPL in `packages/ruby-compat/lib/repl-adapter.ts`. Two places still differ from Rails/irb:

- `Tsrepl#evalInput` returns true for every REPL close, so every exit counts as forced and calls `exit()`. In irb, `eval_input` treats `exit`/`:IRB_EXIT` as a forced exit (`vendor/ruby/v3.3.11/lib/irb.rb:998-1035`), but EOF is not one: it returns normally from `run`.
- `TSREPL.initConfig` leaves out `VERSION`, `AP_NAME` and the history, save-history and completor keys (`vendor/ruby/v3.3.11/lib/irb/init.rb:50-189`).

## Acceptance criteria

- On EOF (Ctrl-D), `run` returns without calling `exit()`. The forced path happens only through an `exit` or `:IRB_EXIT` throw from the evaluated input.
- `initConfig` seats every key `init.rb:50-189` sets, or each omitted key carries a PERMANENT receipt citing a TS shortcoming.
- Tests in `packages/ruby-compat/test/tsrepl.trails.test.ts` cover both.
