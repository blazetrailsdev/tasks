---
title: "Entry_#copy's directory arm drops descendant_directory?'s ArgumentError and Dir.mkdir's rescue for a bare mkdir_p"
status: draft
updated: 2026-09-05
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

`Entry_#copy`'s directory arm (`vendor/ruby/lib/fileutils.rb:2245-2253`) is
three statements, and `copyEntry`
(`packages/ruby-compat/src/file-utils.ts`, the directory branch) is one:

```ruby
when directory?
  if !File.exist?(dest) and descendant_directory?(dest, path)
    raise ArgumentError, "cannot copy directory %s to itself %s" % [path, dest]
  end
  begin
    Dir.mkdir dest
  rescue
    raise unless File.directory?(dest)
  end
```

```ts
} else if (ent.isDirectory()) {
  FileUtils.mkdirP(dest);
```

Two things are lost:

- **The `descendant_directory?` guard** (`fileutils.rb:2378-2384`) and its
  `ArgumentError`. Copying a directory into its own descendant is silently
  accepted here where Ruby raises
  `cannot copy directory <path> to itself <dest>`.
- **`Dir.mkdir` plus its rescue.** `mkdir_p` creates every missing intermediate
  and never raises on an existing directory; Ruby creates exactly one level and
  re-raises anything that is not "the destination is already a directory". A
  missing parent is an `Errno::ENOENT` in Ruby and a silently-created tree here.

Surfaced while porting the `chardev?` / `socket?` / `pipe?` arms in #7498,
which left the arms above it untouched.

## Converged shape

Port the arm statement for statement: the `descendant_directory?` predicate
with Ruby's name and its `ArgumentError` message string, then `Dir.mkdir(dest)`
in a try/catch that rethrows unless `File.directory?(dest)`.
`descendant_directory?` reads `File.dirname` / `casecmp` per
`fileutils.rb:2378-2384`.

## Acceptance criteria

- `copyEntry`'s directory arm raises `ArgumentError` with Ruby's
  `cannot copy directory %s to itself %s` message where
  `descendant_directory?` holds and `dest` does not exist.
- `Dir.mkdir` replaces `mkdirP`, with Ruby's rescue arm.
- A test drives both through `mv`'s cross-device fallback
  (`fileutils.rb:1170-1173`), the path `copy_entry` is reachable on.
