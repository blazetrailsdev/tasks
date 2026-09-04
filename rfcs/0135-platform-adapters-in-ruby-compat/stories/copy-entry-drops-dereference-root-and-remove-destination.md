---
title: "copy_entry drops Ruby's dereference_root and remove_destination parameters"
status: draft
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`copy_entry` (`vendor/ruby/lib/fileutils.rb:1040-1053`) is
`copy_entry(src, dest, preserve = false, dereference_root = false, remove_destination = false)`.
`copyEntry` in `packages/ruby-compat/src/file-utils.ts` accepts `preserve`
alone, so two of Ruby's five parameters have no port:

- `dereference_root` — `src = File.realpath(src)` (`fileutils.rb:1041-1043`)
  before the traversal, so a symlinked root is copied as its target rather than
  as a link.
- `remove_destination` — `File.unlink destent.path if remove_destination &&
(File.file?(destent.path) || File.symlink?(destent.path))`
  (`fileutils.rb:1047`), which unlinks an existing destination entry before
  each copy.

`copyEntry` is module-private and its one caller is `mv`'s cross-device
fallback (`fileutils.rb:1172`), which passes `copy_entry(s, d, true)` — both
missing parameters at their defaults — so nothing is wrong today. The
divergence bites the moment a Rails body sends `FileUtils.copy_entry` or
`cp_r` (`fileutils.rb:952-961`, which forwards `remove_destination:`), neither
of which is ported yet.

`realpathSync` is already on the backend contract (`fs-adapter.ts`) and
`unlinkSync` is mandatory, so no contract change is needed.

## Converged shape

Give `copyEntry` Ruby's full parameter list in Ruby's order and defaults, and
port both bodies: the `File.realpath` root rewrite ahead of the traversal, and
the per-entry unlink guarded by `File.file?` / `File.symlink?`.

## Acceptance criteria

- `copyEntry`'s signature is
  `(src, dest, preserve = false, dereferenceRoot = false, removeDestination = false)`.
- Both arms are ported at `fileutils.rb:1041-1043` and `:1047`.
- `mv`'s call site is unchanged (`copy_entry(s, d, true)`).
- Tests cover a symlinked root under `dereferenceRoot` and an existing
  destination file under `removeDestination`.
