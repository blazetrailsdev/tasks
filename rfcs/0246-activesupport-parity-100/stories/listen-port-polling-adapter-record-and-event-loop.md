---
title: "port listen's polling adapter, Record, Change and event loop"
status: in-progress
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: trails#10578
claim: "2026-11-22T16:44:05Z"
assignee: "listen-port-polling-adapter-record-and-event-loop"
blocked-by: null
closed-reason: null
---

# port listen's polling adapter, Record, Change and event loop

## Context

`vendor/listen/v3.9.0/lib/listen/` holds the machinery a `Listener` drives:
`backend.rb` (40), `adapter.rb` (43, `Adapter.select`), `adapter/base.rb`
(129), `adapter/polling.rb` (40), `adapter/config.rb` (31), `record.rb`
(123), `record/entry.rb` (66), `record/symlink_detector.rb` (47),
`directory.rb` (93), `file.rb` (95), `change.rb` (69),
`queue_optimizer.rb` (129), `event/loop.rb` (94), `event/processor.rb` (126),
`event/queue.rb` (54), `event/config.rb` (40), `silencer.rb` (106),
`silencer/controller.rb` (50), `thread.rb` (54). Node exposes no inotify /
FSEvents binding without a `node:` import, so the Polling adapter is the one
backend; `adapter/linux.rb`, `darwin.rb`, `bsd.rb`, `windows.rb` are not ported.
Background work runs on a ruby-compat `Thread` (CLAUDE.md, "Every promise has
an owner").

## Acceptance criteria

- [ ] Each file above is ported into `packages/listen/lib/` with listen's names
      and control flow, async fs only, through ruby-compat's fs adapter.
- [ ] `Adapter.select` returns `Adapter::Polling`; the native adapters are
      recorded as permanent unported-files rows.
- [ ] listen's specs for record, change, directory, queue_optimizer and polling
      are ported under their rspec names where they do not need a native backend.
