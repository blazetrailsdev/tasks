---
title: "Thor::Base basename and start read $PROGRAM_NAME and ARGV from ruby-compat, not argv[1] and argv.slice(2)"
status: in-progress
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8544
claim: "2026-10-05T17:09:39Z"
assignee: "attribute-method-prefix-pops-a-trailing-null-as-the-keywords"
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/base.rb:771-773` is `File.basename($PROGRAM_NAME).split(" ").first`, and
`base.rb:582` is `def start(given_args = ARGV, config = {})`.

ruby-compat exports only the host raw `argv` (`packages/ruby-compat/src/process-adapter.ts`, `argvSnapshot`), which
under Node is `[node, script, ...args]`. So `packages/trailties/src/thor/base.ts` (trails#8469) spells
`$PROGRAM_NAME` as `argv[1] ?? ""` and `ARGV` as `argv.slice(2)`. Both encode the Node layout at the call site and
are wrong under any adapter whose `argvSnapshot` is laid out differently.

## Acceptance criteria

- [ ] ruby-compat exports the `$PROGRAM_NAME` and `ARGV` analogues, derived once from the process adapter, each
      with a `@noRailsEquivalent PERMANENT` receipt and MRI citation.
- [ ] `basename` is `File.basename(<program name>)` and `start` defaults `givenArgs` to the `ARGV` analogue, with
      no index or slice in `base.ts`.
