---
title: "Entry_#copy's chardev/blockdev/socket/pipe/door arms collapse into one unknown-file-type raise — FsStatResult has no predicate for them"
status: ready
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Entry_#copy` (`vendor/ruby/lib/fileutils.rb:2239-2274`) has eight arms after
`lstat`: `file?`, `directory?`, `symlink?`, then `chardev?`/`blockdev?`
(`raise "cannot handle device file"`, `:2255-2256`), `socket?`
(`raise "cannot handle socket"`, `:2257-2266`), `pipe?`
(`raise "cannot handle FIFO"`, `:2267-2268`), `door?`
(`raise "cannot handle door: #{path()}"`, `:2269-2270`), and a true `else`
(`raise "unknown file type: #{path()}"`, `:2273`).

`copyEntry` in `packages/ruby-compat/src/file-utils.ts` (PR #7476) ports the
first three arms and collapses the remaining five raising arms plus the true
`else` into one `unknown file type` throw, because `FsStatResult`
(`packages/ruby-compat/src/fs-adapter.ts`) carries only `isFile`,
`isDirectory` and an optional `isSymbolicLink` — there is no predicate to tell
a character device from a socket from a FIFO. The gap is disclosed in
`copyEntry`'s JSDoc; this story closes it.

The path this reaches is `mv`'s cross-device fallback
(`fileutils.rb:1170-1173`), which calls `copy_entry(s, d, true)`: moving a FIFO
or a socket across devices reports Ruby's generic message instead of the
specific one.

## Converged shape

- Add the optional predicates Ruby's arms select on to `FsStatResult` —
  `isCharacterDevice?()`, `isBlockDevice?()`, `isSocket?()`, `isFIFO?()`.
  Node's `Stats` already carries all four, so the Node registration
  (`tryAutoRegisterNode`, which spreads `node:fs` wholesale) wires them for
  free, exactly as `atime` and `lchownSync` were wired by #7476.
- Port each arm in Ruby's case order with Ruby's own message string. Ruby's
  `socket?` arm additionally builds a `UNIXServer` and chmods it; the
  `door?` arm has no JS analogue at all and can raise on the predicate alone.

## Acceptance criteria

- Each of `chardev?`/`blockdev?`, `socket?`, `pipe?` raises Ruby's own message
  where the backend supplies the predicate.
- The `unknown file type` message is reached only by Ruby's true `else`.
- The disclosure paragraph on `copyEntry`'s JSDoc is deleted, not reworded.
- A test covers a FIFO through `mv`'s cross-device fallback.
