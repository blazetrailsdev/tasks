---
title: "Port Warden::Config and config_spec"
status: draft
updated: 2026-11-03
rfc: "0000-warden-gem-port"
cluster: warden-core
packages: ["warden"]
deps: ["warden-package-setup"]
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/warden/config.rb:1-112`. `class Config < Hash` (`:7`) with
`hash_accessor :failure_app, :default_scope, :scope_defaults,
:intercept_401` (`:21-35`, a `class_eval` string defining a reader and a
writer per name over `self[name]`), `initialize(other = {})` merging
defaults (`:37-43`), `initialize_copy` deep-duping `:default_strategies` and
`:scope_defaults` through `deep_dup` (`:45-51`, `:107-110`),
`silence_missing_strategies!` / `?` (`:53-59`), `default_strategies(*strategies)`
with its `scope:` option (`:63-72`), `scope_defaults(scope, opts)`
(`:74-87`), `strategies` (`:89-91`, returns `Warden::Strategies`), and the
`serialize_into_session` / `serialize_from_session` forwarders to
`Warden::Manager` (`:95-105`).

Decide RFC Open question 3 here: a ruby-compat `Hash` subclass only where a
`Hash` feature is observable (`packages/ruby-compat/README.md` § "When a Ruby
Hash is a Hash and when it is an object"). `Proxy#initialize` dups it
(`proxy.rb:30`), so `initializeCopy` is reached through `rbObjDup`. The
generated accessors are four written members (a closed list), each a
get/set pair over the hash read.

Spec: `spec/warden/config_spec.rb` (7 examples). `strategies` and the
serializer forwarders name `Warden::Strategies` / `Warden::Manager`, which land
in sibling stories: read them through the `Warden` namespace at call time
(CLAUDE.md § "Call-time constant resolution").

## Acceptance criteria

- `packages/warden/src/config.ts` ports every `def` above at its Rails name;
  `parity:api` credits `config.rb` fully.
- `config.test.ts` ports all 7 examples by name; any that needs `Manager`
  lands `it.skip` with a note naming `port-warden-manager`, and that story
  un-skips it.
- `parity:api:extra --package warden` reports nothing new.
