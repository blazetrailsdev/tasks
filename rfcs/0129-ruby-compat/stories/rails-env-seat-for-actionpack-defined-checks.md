---
title: "defined?(Rails.env) reads an unset global, so process_action's development newline is unreachable"
status: ready
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: 25
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::LogSubscriber#process_action`
(`vendor/rails/actionpack/lib/action_controller/log_subscriber.rb:40`) ends its
message with a development-only blank line:

```ruby
message << "\n\n" if defined?(Rails.env) && Rails.env.development?
```

PR #7437 ported that line as a guarded read of a `Trails` global
(`packages/actionpack/src/action-controller/log-subscriber.ts`), because
`defined?(Rails.env)` is a constant check and actionpack cannot import
trailties — the dependency runs the other way. The guard is faithful, but
**nothing in the repo ever sets `globalThis.Trails`**, so the arm is
unreachable: a booted development app never gets the blank line.

Rails resolves `Rails` through Zeitwerk at call time; trailties owns the
constant (`packages/trailties/src/rails.ts`, and the zero-import
`trails-slot.ts` that CLAUDE.md's "Call-time constant resolution" section
already ratifies for exactly this cross-package shape).

## Converged shape

A reachable seat for the `Rails` constant that actionpack can read at call
time without importing trailties — the ratified zero-import slot is the
obvious candidate, populated by trailties at boot the way
`trails-slot.ts` already is. The `log_subscriber.rb:40` read then answers
truthfully in a booted development app and stays `defined?`-false outside one.

Note this is not log-subscriber-specific: any actionpack body that mirrors a
Rails `defined?(Rails.env)` / `Rails.application` read needs the same seat, so
the story should settle the seat once rather than per call site.

## Acceptance criteria

- A booted development app gets the trailing blank line from
  `process_action`; a non-booted context does not.
- The seat is the ratified zero-import slot shape (CLAUDE.md, "Call-time
  constant resolution"), not a fresh per-call-site invention.
- No actionpack -> trailties import edge is introduced.
- actionpack and trailties green.
