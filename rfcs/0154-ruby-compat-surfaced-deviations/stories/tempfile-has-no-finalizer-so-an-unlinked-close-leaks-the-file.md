---
title: "Tempfile has no finalizer, so RewindableInput's unlinked close leaks the file"
status: draft
updated: 2026-10-19
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

MRI's `Tempfile.new` registers a finalizer that unlinks the file when the object is collected
(`vendor/ruby/v3.3.11/lib/tempfile.rb:150-165`, `Tempfile::Remover`). Rack leans on it:
`RewindableInput#make_rewindable` sets `@unlinked = true` on POSIX without unlinking
(`vendor/rack/v3.1.14/lib/rack/rewindable_input.rb:89-92`), and `#close` then calls plain
`close` (`:66-67`), leaving removal to the finalizer.

ruby-compat's `Tempfile` (`packages/ruby-compat/src/tempfile.ts`) has no finalizer, so every
`RewindableInput` that buffered data leaves a `RackRewindableInput*` file in the tmpdir
(surfaced by trails#9066).

## Acceptance criteria

- [ ] `Tempfile.new` registers a `FinalizationRegistry` cleanup that unlinks the path, mirroring `Tempfile::Remover`, and `unlink` / `close!` unregister it.
- [ ] A test shows the registry entry is removed on `closeBang` and present after `close`.
