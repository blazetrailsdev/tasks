---
title: "FileUtils.copy_file drops Ruby's dereference argument — copyMetadata has no lstat arm to select"
status: done
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 7476
claim: "2026-09-04T12:29:20Z"
assignee: "fileutils-copy-file-drops-rubys-dereference-argument"
blocked-by: null
closed-reason: null
---

## Context

Ruby's `FileUtils.copy_file` is

```ruby
def copy_file(src, dest, preserve = false, dereference = true)
```

(`vendor/ruby/lib/fileutils.rb:1076-1080`). trails'
`FileUtils.copyFile` (`packages/ruby-compat/src/file-utils.ts`, made public by
PR #7472) takes only `(src, dest, preserve = false)` — the fourth argument is
dropped, with the reason cited at the declaration.

`dereference` is carried on the `Entry_` (`fileutils.rb:2080`) and read only by
`Entry_#lstat` (`fileutils.rb:2192-2198`): `File.stat(path())` when true,
`File.lstat(path())` when false. `Entry_#copy_metadata`
(`fileutils.rb:2285-2312`) is the one body on this path that calls it, so the
argument selects an arm under `preserve: true` alone, and only for a symlink
source — `dereference: true` copies the TARGET's utime/mode/ownership,
`dereference: false` copies the link's own and skips `File.utime` entirely via
the `if !st.symlink?` guard at `fileutils.rb:2287`.

trails' module-private `copyMetadata` (`file-utils.ts:~170`) calls
`getFs().statSync` unconditionally, so it has neither arm to select — which is
why the argument was dropped rather than accepted inert. It could not be
carried unused either: `unused-imports/no-unused-vars` requires an unused
parameter be spelled `_dereference`, losing the Rails name.

`fileutils-copy-metadata-loses-atime-and-the-symlink-arms` (RFC 0135, ready) is
the story that gives `copyMetadata` its `lstat` arm. This story is the
signature half that lands on top of it, and is cited by name in
`copyFile`'s JSDoc.

## Acceptance criteria

- [ ] `FileUtils.copyFile` takes `(src, dest, preserve = false, dereference = true)`
      — Ruby's parameter names, order and defaults.
- [ ] `dereference` is forwarded to `copyMetadata`, which lstats when it is
      `false` and stats when it is `true`, mirroring `Entry_#lstat`
      (`fileutils.rb:2192-2198`), and skips `File.utime` for a symlink
      (`fileutils.rb:2287`).
- [ ] `cp` and `copyEntry` still route through the same seat.
- [ ] The "not accepted until it does" clause is deleted from `copyFile`'s
      JSDoc — the deviation is gone, not re-justified.
- [ ] Tests cover both arms against a symlink source under `preserve: true`.
