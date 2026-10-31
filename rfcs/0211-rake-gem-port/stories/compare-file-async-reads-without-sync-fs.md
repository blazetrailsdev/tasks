---
title: "FileUtils.compareFileAsync reads without synchronous fs calls"
status: ready
updated: 2026-10-31
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`FileUtils.compare_file` (`vendor/ruby/v3.3.11/lib/fileutils.rb:1507-1514`) opens both files and `compare_stream` (`:1530-1542`) sizes its reads with `fu_stream_blksize` (`:2045-2052`), which calls `s.stat` on any stream that answers it. In trails, `FileUtils.compareFileAsync` (`packages/ruby-compat/src/file-utils.ts`) reaches `File.open` and `IO#read` over `openSync` / `readSync` (`fs-adapter.ts`), blocking the event loop per block. `IO#stat` (`io.ts`) raises `IOError` when the optional `fstatSync` is absent, where Ruby's `IO#stat` always answers, so `compareFileAsync` raises on such an adapter.

## Acceptance criteria

- [ ] `compareFileAsync` reads both files without a synchronous fs call, in `bsize` blocks stopping at the first differing block.
- [ ] `compareFileAsync` works on an adapter with no `fstatSync`, covered by a test, with `fuStreamBlksize` falling to `fuDefaultBlksize`'s 1024 only as Rails' arms allow.
