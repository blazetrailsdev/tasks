---
title: "console-prompt-resolves-unloaded-autoload-constants"
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
claim: "2026-11-08T01:49:23Z"
assignee: "console-prompt-resolves-unloaded-autoload-constants"
blocked-by: null
closed-reason: null
---

## Context

`IRB::Irb#loadHelperMethodsToMain` (`packages/ruby-compat/lib/repl-adapter.ts`, trails#9856) chains the REPL's main object onto `TopLevel`, so a constant already seated there resolves at the prompt, as one resolves at `TOPLEVEL_BINDING`. In Ruby a not-yet-loaded constant typed at the prompt still loads, because Zeitwerk's `define_autoload` calls `Module#autoload` (`vendor/zeitwerk/v2.7.2/lib/zeitwerk/loader.rb:542`) and Ruby runs the `require` on first reference. trails' `require` (`packages/zeitwerk/src/core-ext/kernel.ts`) is async, and a plain property read on `TopLevel` cannot start it. So in development (`eager_load` false), `User` at the `trails console` prompt is undefined until something has loaded `app/models/user`. Before trails#9856, `IRBConsole#loadModels` hid this by importing every file in `app/models`.

## Acceptance criteria

- [ ] At the `trails console` prompt, a not-yet-loaded autoloadable constant (`User`) resolves on first reference in development, through the Zeitwerk loader rather than a directory scan in the console.
- [ ] The mechanism is cited against `Module#autoload` / `define_autoload`, and the console code stays line for line with `irb_console.rb`.
- [ ] A test covers a constant that is not seated when the session starts.
