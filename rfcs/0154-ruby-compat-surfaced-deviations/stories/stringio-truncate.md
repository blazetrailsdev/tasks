---
title: "Port StringIO#truncate"
status: draft
updated: 2026-11-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

ruby-compat `StringIO` has no `truncate`. MRI `strio_truncate` (`vendor/ruby/v3.3.11/ext/stringio/stringio.c`) truncates the buffer to `len` and pads with NUL when it grows; it returns 0. solid_queue's `rewind_io` (`vendor/solid_queue/v1.7.2/test/unit/dispatcher_test.rb:190-193`) calls `log.truncate(0); log.rewind`.

## Acceptance criteria

- `StringIO#truncate(len)` ported per MRI (shrink, NUL-pad on grow, raise IOError if not writable, return 0).
- Tests mirror ruby/stringio's test_truncate.
