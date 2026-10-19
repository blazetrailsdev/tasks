---
title: "rack-rewindable-input-buffers-into-tempfile"
status: in-progress
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9071
claim: "2026-10-19T15:17:49Z"
assignee: "rack-rewindable-input-buffers-into-tempfile"
blocked-by: null
closed-reason: null
---

## Context

`Rack::RewindableInput#make_rewindable` (`vendor/rack/v3.1.14/lib/rack/rewindable_input.rb:78-107`)
buffers `@io` into `Tempfile.new('RackRewindableInput')` with a 4 KiB `@io.read(1024 * 4, buffer)`
loop and `@rewindable_io.write`, then every reader (`gets`, `read`, `each`, `rewind`, `size`,
`:35-58`) delegates to `@rewindable_io`; `close` (`:64-74`) is `close` / `close!` on it.

trails' `packages/rack/src/rewindable-input.ts` keeps an in-memory `Buffer` with its own
`_pos` and `_bufferData`, so `makeRewindable` calls neither `new` nor `write` — the two
rows in `scripts/api-compare/call-mismatches-exclude/rack/rewindable-input.json`.
`RewindableInput::Middleware#call` (`:23-26`) also wraps `env[RACK_INPUT]` unconditionally,
where TS skips a nil input.

Blocker inside ruby-compat: `Tempfile`/`IO` (`packages/ruby-compat/src/io.ts`) have
`read`, `write`, `rewind`, `size`, `closeBang` but no `IO#gets` or `IO#each`, which the
delegating readers need. Left out of the rack call-row burndown (trails PR for
rack-call-rows-burndown-request-through-utils) for that reason.

## Acceptance criteria

- [ ] ruby-compat `IO` gains `gets` and `each` (MRI `io.c` citations).
- [ ] `RewindableInput` mirrors rewindable_input.rb: `@rewindable_io` Tempfile, `makeRewindable`'s read/write loop, delegating readers, `close`/`closeBang`, `Middleware`.
- [ ] `call-mismatches-exclude/rack/rewindable-input.json` deleted and tightened.
