---
title: "port-irb-setup-conf-and-run-for-irb-console"
status: in-progress
updated: 2026-11-08
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9856
claim: "2026-11-08T00:45:28Z"
assignee: "port-irb-setup-conf-and-run-for-irb-console"
blocked-by: null
closed-reason: null
---

## Context

`IRBConsole#start` (`packages/trailties/src/commands/console/irb-console.ts`) mirrors
`vendor/rails/v8.0.2/railties/lib/rails/commands/console/irb_console.rb:76-112`, which drives the
irb gem: `IRB.setup(nil)`, `IRB.conf[:USE_AUTOCOMPLETE]` behind
`!Rails.env.local? && !ENV.key?("IRB_USE_AUTOCOMPLETE")` (`:81-83`), `IRB.conf[:PROMPT][:RAILS_PROMPT]`,
`IRB.conf[:BACKTRACE_FILTER]` wrapping `Rails.backtrace_cleaner.filter` (`:99-108`), and
`IRB::Irb.new.run(IRB.conf)` (`:112`). trails has no irb port, so `start` stands on ruby-compat's
`getReplAsync()` (`node:repl`) and carries five receipts: `key?`, `filter`, `run` (missing calls) and
`loadModels`, `clearAllConnectionsBang` (invented arms). `loadModels` exists because the node REPL's
context does not resolve constants through `TopLevel` the way IRB's main binding resolves them through
`Object`; `clearAllConnectionsBang` exists because Node does not exit while pool sockets are open,
where Ruby's interpreter exits after `run` returns.

## Acceptance criteria

- [ ] An `IRB` port (`IRB.setup`, `IRB.conf`, `IRB::Irb#run`, the `:IRB_EXIT` path) on top of the REPL adapter, whose evaluation context resolves constants through `TopLevel`.
- [ ] `IRBConsole#start` mirrors `irb_console.rb:76-112` line for line: the `IRB_USE_AUTOCOMPLETE` guard, the `RAILS_PROMPT` hash, both `BACKTRACE_FILTER` arms, `PROMPT_MODE`.
- [ ] `loadModels` and the trailing `clearAllConnectionsBang` are deleted; the five receipts on `start` are gone.
