---
title: "BroadcastLogger: port initialize_copy, drop invented dup arm"
status: ready
updated: 2026-11-21
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `BroadcastLogger#initialize_copy` (`vendor/rails/v8.0.2/activesupport/lib/active_support/broadcast_logger.rb:221-227`) resets `@broadcasts`, dups `progname` and `formatter`, then calls `broadcast_to(*other.broadcasts.map(&:dup))`. trails instead defines a public `dup()` (`packages/activesupport/lib/broadcast-logger.ts:155`) that rebuilds the copy with `new this.constructor()`. For each broadcast it uses an invented arm: `logger.dup?.() ?? Object.assign(Object.create(proto), logger)`. trails#10472 left this alone when it converged `TaggedLogging.new` onto `rbObjClone`.

## Acceptance criteria

- `BroadcastLogger` ports `initializeCopy(other)` with Rails' body, so `rbObjDup` / `rbObjClone` reach it, and the public `dup()` override is deleted.
- Each broadcast is copied with `rbObjDup(logger)`, with no `dup?.()` / `Object.assign` arm.
- The tagged-logging BroadcastLogger clone test and the broadcast-logger tests pass.
