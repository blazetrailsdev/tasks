---
title: "object-space-each-object-tracks-io"
status: done
updated: 2026-10-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#9184
claim: "2026-10-21T18:17:43Z"
assignee: "object-space-each-object-tracks-io"
blocked-by: null
closed-reason: null
---

# ObjectSpace.each_object(File) answers the live IO instances

## Context

marcel's `test "closes Pathname files after use"`
(`vendor/marcel/v1.0.4/test/mime_type_test.rb:21-25`) is:

```ruby
open_files = ObjectSpace.each_object(File).reject(&:closed?)
assert open_files.none? { |f| f.path == @path }
```

MRI's `ObjectSpace.each_object` (`vendor/ruby/v3.3.11/gc.c`, `os_obj_of`) walks the heap and yields every
object of the class that is not yet collected, closed ones included. ruby-compat's `ObjectSpace`
(`packages/ruby-compat/src/object-space.ts:46-54`) has only `defineFinalizer` and `WeakMap`, so the
generated marcel test fails with `ObjectSpace.eachObject is not a function`.

JS cannot walk the heap, but ruby-compat constructs every `IO` / `File` itself
(`packages/ruby-compat/src/io.ts:523` `class IO`, `file.ts:140` `class File extends IO`). Tracking those instances in a
module-level set of `WeakRef`s gives the same answer MRI does for IO: every instance not yet
collected. An unreachable, uncollected `WeakRef` target is still yielded, as MRI yields an
unreachable, unswept object. `reject(&:closed?)` does the real work in the test, so it then checks
what it is about: `MimeType.for(Pathname)` closes the file it opened.

## Acceptance criteria

- `IO`'s constructor registers each instance in a module-level `Set<WeakRef<IO>>`.
- `ObjectSpace.eachObject(klass)` answers the live tracked instances that are `instanceof klass`,
  closed ones included, pruning collected refs. With a block it yields each and answers the
  count, as `os_obj_of` does; without a block it answers an Enumerator or Array as the existing
  ruby-compat enumerable convention does.
- A `klass` outside the tracked hierarchy raises `NotImplementedError` rather than answering an
  empty list.
- `eachObject` carries `@noRailsEquivalent PERMANENT` citing `vendor/ruby/v3.3.11/gc.c` (`os_obj_of`), a C
  function with no Ruby source.
- A ruby-compat test: a `File` left open is yielded and not `closed?`; after `close` it is still
  yielded and `closed?`; a `String` class argument raises `NotImplementedError`.
- marcel's generated `closes Pathname files after use` passes on the codegen branch, and fails if
  `MimeType.for` leaves the file open.
