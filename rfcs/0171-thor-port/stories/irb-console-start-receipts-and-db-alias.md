---
title: "irb-console-start-receipts-and-db-alias"
status: done
updated: 2026-11-07
rfc: "0171-thor-port"
cluster: null
packages: []
deps:
  - port-irb-setup-conf-and-run-for-irb-console
deps-rfc: []
est-loc: null
priority: null
pr: trails#9811
claim: "2026-11-06T23:17:15Z"
assignee: "irb-console-start-receipts-and-db-alias"
blocked-by: null
closed-reason: null
---

## Context

`console-sandbox-rollback-and-irb-helpers` ported the sandbox rollback, the AR `console do` block and the IRB helpers. Left over in `packages/trailties/src/commands/console/irb-console.ts` `IRBConsole#start`:

- `ENV.key?("IRB_USE_AUTOCOMPLETE")` autocomplete (`vendor/rails/v8.0.2/railties/lib/rails/commands/console/irb_console.rb:81-83`).
- `Rails.backtrace_cleaner.filter` as IRB's `BACKTRACE_FILTER` (`:99-108`).
- `IRB::Irb#run` standing on `node:repl`; the invented `loadModels` (Zeitwerk now seats app constants on `TopLevel`) and `clearAllConnectionsBang`.
- `bin.ts` lacks Rails' `db` => `dbconsole` alias (`railties/lib/rails/commands.rb:5-13`) because `trails db` is a commander group.

## Acceptance criteria

- [ ] Each `@missingRailsCall` / `@inventedArm` receipt on `IRBConsole#start` is converged.
- [ ] `bin.ts` carries Rails' full alias table once `db` is no longer a commander group.
