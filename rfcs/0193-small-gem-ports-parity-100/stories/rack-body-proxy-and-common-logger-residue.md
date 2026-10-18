---
title: "rack: BodyProxy#close respond_to?, CommonLogger#log strftime and [:print:] escape"
status: draft
updated: 2026-10-18
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

These are pre-existing deviations next to the bodies trails#9021 converged:

- `BodyProxy#close` (`packages/rack/src/body-proxy.ts`) tests
  `typeof this.body.close === "function"`. Rails is
  `@body.close if @body.respond_to?(:close)`
  (`vendor/rack/v3.1.14/lib/rack/body_proxy.rb`), so it should go through
  `rbObjRespondTo`, as `Head#call` now does.
- `CommonLogger#log` (`packages/rack/src/common-logger.ts`) builds the timestamp
  by hand where Rails has `Time.now.strftime("%d/%b/%Y:%H:%M:%S %z")`
  (`common_logger.rb:59`). It also replaces `msg.gsub!(/[^[:print:]]/)` with a
  `\p{Cc}\p{Cn}…` class (`:69`) and `msg[-1] = "\n"` with a slice (`:70`).
  Converge onto the ruby-compat `Time#strftime` and a `[:print:]` equivalent.

## Acceptance criteria

- [ ] `BodyProxy#close` reads `respond_to?(:close)` through `rbObjRespondTo`.
- [ ] `CommonLogger#log` formats the time through `strftime` with Rails' format
      string, and its non-printable escape matches `[^[:print:]]`.
