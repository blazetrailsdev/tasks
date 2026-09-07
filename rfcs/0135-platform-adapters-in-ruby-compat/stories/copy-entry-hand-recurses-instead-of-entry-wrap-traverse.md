---
title: "copy_entry hand-recurses where fileutils.rb:1044 traverses through Entry_#wrap_traverse, interleaving the metadata pass"
status: done
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: 47
pr: 7580
claim: "2026-09-06T22:37:23Z"
assignee: "copy-entry-hand-recurses-instead-of-entry-wrap-traverse"
blocked-by: null
closed-reason: null
---

## Context

`FileUtils.copy_entry` (`vendor/ruby/lib/fileutils.rb:1044-1052`) does not
recurse itself. It builds one `Entry_` for the root and hands `wrap_traverse`
two procs:

```ruby
Entry_.new(src, nil, false).wrap_traverse(proc do |ent|
  destent = Entry_.new(dest, ent.rel, false)
  File.unlink destent.path if remove_destination && (File.file?(destent.path) || File.symlink?(destent.path))
  ent.copy destent.path
end, proc do |ent|
  destent = Entry_.new(dest, ent.rel, false)
  ent.copy_metadata destent.path if preserve
end)
```

`Entry_#wrap_traverse` (`fileutils.rb:2384-2397`) runs the PRE proc over the
whole tree in preorder and only then the POST proc in postorder.
`packages/ruby-compat/src/file-utils.ts`'s `FileUtils.copyEntry` (PR #7521)
instead hand-recurses over `readdirSync` and calls `copyMetadata` inline at the
end of each directory arm.

Two consequences follow from the missing decomposition:

- **Metadata ordering.** Ruby copies every entry first and applies metadata
  afterwards in postorder; trails interleaves them per directory. A directory's
  mtime set by `copy_metadata` before its children are written is then
  clobbered by those writes — the interleaving is exactly what Ruby's two-pass
  `wrap_traverse` exists to avoid.
- **`Entry_` is absent.** `Entry_#rel`, `#path`, `#entries`, `#preorder_traverse`,
  `#postorder_traverse` and `#wrap_traverse` (`fileutils.rb:2100-2400`) have no
  port, so every FileUtils body that Ruby writes as an `Entry_` traversal —
  `copy_entry`, `remove_entry`, `remove_entry_secure`, `cp_r` — is a bespoke
  recursion here. `file-utils.ts` already carries `entryLstat` and
  `copyMetadata` as loose functions standing in for `Entry_` methods.

## Converged shape

Port `Entry_` as a class with Ruby's members and rewrite `copy_entry` as the
two-proc `wrap_traverse` call above, so the metadata pass is postorder and
separate. `entryLstat` and `copyMetadata` fold into `Entry_#lstat` and
`Entry_#copy_metadata` at their Rails names.

Related and already filed: `entry-copy-collapses-rubys-device-socket-fifo-door-arms`
(the `Entry_#copy` arms) and `entry-copy-directory-arm-drops-descendant-guard-and-dir-mkdir`
(the directory arm) — this story is the traversal that calls them.

## Acceptance criteria

- `Entry_` exists in `packages/ruby-compat/src/file-utils.ts` with Ruby's
  `rel`, `path`, `entries`, `preorder_traverse`, `postorder_traverse` and
  `wrap_traverse` (`fileutils.rb:2100-2400`), cited.
- `FileUtils.copyEntry` is the `wrap_traverse` call of `fileutils.rb:1044-1052`,
  with the pre proc carrying the `remove_destination` unlink and `ent.copy`,
  and the post proc carrying `copy_metadata` under `preserve`.
- A test asserts a directory tree's metadata is applied after its children are
  written, which the interleaved recursion cannot satisfy.
- `mv`'s cross-device fallback and the existing `copy_entry` tests still pass.
