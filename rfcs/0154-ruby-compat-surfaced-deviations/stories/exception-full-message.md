---
title: "ruby-compat ports Exception#full_message"
status: draft
updated: 2026-11-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Exception#full_message` is `exc_full_message` (`vendor/ruby/v3.3.11/error.c:3305`). ruby-compat has none, so `examples/twelve-dollar-server` reads `exception.stack` where the submission calls `exception.full_message`.

## Acceptance criteria

- ruby-compat ports `full_message` with `highlight:` and `order:`, citing MRI.
- The example calls it in place of `exception.stack`.
