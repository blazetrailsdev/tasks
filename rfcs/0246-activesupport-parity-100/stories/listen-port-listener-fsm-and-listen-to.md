---
title: "port listen's Listener, Fsm and Listen.to as @blazetrails/listen"
status: draft
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# port listen's Listener, Fsm and Listen.to as @blazetrails/listen

## Context

`vendor/listen/v3.9.0` is vendored (registered in `vendor/sources.ts` by the
libxml-ruby port PR). `evented_file_update_checker.rb:117-123` calls
`Listen.to(*dirs, &block)`, `listener.start`, `listener.stop` and
`listener.wait_for_state(:processing_events)`. Those live in
`lib/listen.rb` (`Listen.to`, 47 lines), `lib/listen/listener.rb` (136),
`lib/listen/fsm.rb` (133, `wait_for_state` / `transition`),
`lib/listen/listener/config.rb` (41) and `lib/listen/options.rb` (26).
`Listener#initialize` builds `Backend`, `Event::Config` and `Event::Processor`
(`listener.rb:37-56`), so this story depends on the adapter/record story.

## Acceptance criteria

- [ ] `packages/listen` exists (registered in tsconfig, vitest aliases, ci.yml
      unit lane, api/test-compare lists) and mirrors `listen.rb`, `fsm.rb`,
      `listener.rb`, `listener/config.rb`, `options.rb` by name and control flow.
- [ ] `Listener#start` / `#stop` / `#pause` and `Fsm#wait_for_state` are ported,
      with listen's `spec/lib/listen/listener_spec.rb` and `fsm_spec.rb`
      examples that do not need a real fs ported under their rspec names.
- [ ] No `node:*` imports, no `process.*`, async fs only (ruby-compat fs adapter).
