---
title: "port-listen-gem-for-evented-file-update-checker"
status: ready
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# port the listen gem (prerequisite of EventedFileUpdateChecker)

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support/evented_file_update_checker.rb` builds on
`Listen.to(...)` (`require "listen"`). trails has no `listen` port and the gem is not vendored
(`vendor/` has no `listen`), so `activesupport-port-evented-file-update-checker` cannot start.

## Acceptance criteria

- [ ] Vendor the `listen` gem under `vendor/listen/<version>/` and port the surface
      `evented_file_update_checker.rb` uses (`Listen.to`, the listener's `start`/`stop`, change callbacks) as `@blazetrails/listen`, async fs only.
