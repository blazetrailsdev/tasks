---
title: "SchemaCache#dump_to inlines Rails' private open, skipping atomic_write and zipper.mtime = 0"
status: in-progress
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 7543
claim: "2026-09-05T23:06:51Z"
assignee: "converge-hash-config-configuration-alias"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing PR #7505
(`port-zlib-gzipreader-open-for-schema-cache-read`), which put
`Zlib::GzipReader.open` / `GzipWriter.open` on the trails Zlib seam and pointed
`SchemaCache.read` / `#dumpTo` at them.

`read` (`schema_cache.rb:244-252`) now mirrors Rails line for line. `dump_to`
does not. Rails is
`activerecord/lib/active_record/connection_adapters/schema_cache.rb:406-413`:

```ruby
def dump_to(filename)
  open(filename) { |f|
    if filename.include?(".dump")
      f.write(Marshal.dump(self))
    else
      f.write(YAML.dump(self))
    end
  }
end
```

delegating to a private `open` (`schema_cache.rb:461-475`):

```ruby
def open(filename)
  FileUtils.mkdir_p(File.dirname(filename))

  File.atomic_write(filename) do |file|
    if File.extname(filename) == ".gz"
      zipper = Zlib::GzipWriter.new file
      zipper.mtime = 0
      yield zipper
      zipper.flush
      zipper.close
    else
      yield file
    end
  end
end
```

`packages/activerecord/src/connection-adapters/schema-cache.ts` `dumpTo`
inlines all of that into one body and diverges on three counts:

1. There is no private `open` helper — Rails extracts one and trails does not,
   so the `.gz` / plain fork and the `mkdir_p` live in `dumpTo` itself.
2. No `File.atomic_write` (`activesupport/lib/active_support/core_ext/file/atomic.rb:11`).
   trails writes the destination directly, so an interrupted dump leaves a
   truncated schema cache where Rails leaves the previous one intact.
3. No `zipper.mtime = 0`. Rails zeroes the gzip header mtime so two dumps of
   the same cache are byte-identical; trails' `GzipWriter` has no `mtime=`
   at all, so every dump differs in bytes 5-8.

(3) is the one with teeth: `converge-dump-schema-cache-tests-onto-cache-dump-filename`
and any future byte-comparison of two dumps cannot hold while the header
carries a wall clock.

## Converged shape

A private `open(filename, block)` on `SchemaCache` with Rails' body, and
`dumpTo` reduced to Rails' four lines through it. `Zlib::GzipWriter` gains
`mtime=` (`rb_gzfile_set_mtime`, `vendor/ruby/ext/zlib/zlib.c:3576`) and
`flush` (`rb_gzwriter_flush`, `zlib.c:3720`), and the gzip header's MTIME field
is written from it rather than from the clock — the trails `ZlibAdapter` seam
hands `node:zlib` the `mtime` option for this. `File.atomicWrite` already
exists in ruby-compat; see the sibling story
`atomic-write-guards-chown-chmod-rails-calls-unconditionally`.

## Acceptance criteria

- [ ] `SchemaCache` has a private `open` mirroring `schema_cache.rb:461-475`,
      and `dumpTo` is Rails' `schema_cache.rb:406-413` through it.
- [ ] The write goes through `File.atomicWrite`, so an interrupted dump leaves
      the previous file intact.
- [ ] `Zlib::GzipWriter` answers `mtime=` and `flush`, and `open` sets
      `mtime = 0`, so dumping the same cache twice is byte-identical.
- [ ] `schema-cache.test.ts` keeps its names and passes; a new case in
      `schema-cache.trails.test.ts` pins the byte-identical round trip.
