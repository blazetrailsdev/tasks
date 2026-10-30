---
title: "FileUtils.compare_stream reads block by block"
status: claimed
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-10-30T19:56:42Z"
assignee: "file-utils-compare-stream-reads-blocks"
blocked-by: null
closed-reason: null
---

## Context

`FileUtils.compare_stream` (`vendor/ruby/v3.3.11/lib/fileutils.rb:1530-1542`) reads two IOs a block at a time, sized by `fu_stream_blksize`. `FileUtils.compareStream` in `packages/ruby-compat/src/file-utils.ts` takes two whole buffers, and `compareFileAsync` reads both files fully into memory (`fileutils.rb:1507-1514` opens them with `File.open`).

## Acceptance criteria

- [ ] `compareStream` takes two streams and reads `bsize` blocks, stopping at the first differing block, with `fu_stream_blksize` / `fu_blksize` / `fu_default_blksize` ported.
- [ ] `compareFileAsync` opens both files and passes the streams.
