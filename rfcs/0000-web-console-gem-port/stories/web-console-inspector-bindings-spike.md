---
title: "Spike: capture frame scopes on a raise through node:inspector"
status: draft
updated: 2026-11-19
rfc: "0000-web-console-gem-port"
cluster: bindings
packages: [ruby-compat]
deps: [vendor-web-console-gem]
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

The RFC's § "Bindings from the V8 inspector" design. `bindex` gives
`Exception#bindings` and `Bindex.current_bindings`
(`vendor/web-console/v4.3.0/lib/web_console/extensions.rb:13`); ruby-compat's
`Binding` (`packages/ruby-compat/lib/variable.ts:96`) holds only a receiver.

## Acceptance criteria

- [ ] A test shows an in-process `inspector.Session` capturing each unwound
      frame's scope chain when an error is thrown, resuming, then evaluating
      an expression against a captured frame's locals afterwards.
- [ ] If same-thread capture deadlocks, the same with a worker connected by
      `Session#connectToMainThread`.
- [ ] Measured cost per thrown error with pause-on-exceptions on, recorded in
      the RFC to answer its open question.
