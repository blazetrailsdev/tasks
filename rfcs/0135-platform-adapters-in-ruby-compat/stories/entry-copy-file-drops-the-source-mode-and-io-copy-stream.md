---
title: "Entry_#copy_file is copyFileSync, dropping Ruby's source-mode create and IO.copy_stream"
status: draft
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Entry_#copy_file` (`vendor/ruby/lib/fileutils.rb:2277-2283`) is:

```ruby
def copy_file(dest)
  File.open(path()) do |s|
    File.open(dest, 'wb', s.stat.mode) do |f|
      IO.copy_stream(s, f)
    end
  end
end
```

Two things Ruby does that `packages/ruby-compat/src/file-utils.ts`'s
`Entry_#copyFile` (PR #7580) does not: it opens the destination with the
SOURCE's mode as the create mode, and it streams the bytes through
`IO.copy_stream` rather than a whole-file backend primitive. trails calls
`getFs().copyFileSync(this.path, dest)`, so the destination is created with the
backend's default mode and only `copy_metadata` — which runs solely under
`preserve` (`fileutils.rb:1051`, `:1079`) — ever brings the mode across.

So an unpreserved `FileUtils.cp` / `copy_entry` of a mode-0755 file produces a
0644 destination here and a 0755 one in Ruby.

`IO` and `File.open` are both ported (`packages/ruby-compat/src/io.ts`,
`file.ts`); whether `IO.copy_stream` exists on the backend contract is the
thing to check first.

## Converged shape

`Entry_#copyFile` opens the source, opens the destination with `s.stat().mode`
as the create mode, and copies the stream — `File.open`/`IO.copy_stream` at the
Rails names, not `copyFileSync`. If the backend contract cannot express a
create mode, the mode arrives through a `File.chmod` half, as `fu_mkdir`
already does for `Dir.mkdir path, mode` (`file-utils.ts`, `fileutils.rb:396-404`).

## Acceptance criteria

- `Entry_#copyFile` gives the destination the source's mode with no `preserve:`.
- A test copies a 0755 source without `preserve` and asserts the destination's
  mode, which `copyFileSync` cannot satisfy.
- The existing `copy_file` / `copy_entry` / `mv` tests still pass.
