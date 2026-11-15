---
title: "ruby-compat async File.stat for vite-assets Builder#file_digest"
status: draft
updated: 2026-11-15
rfc: "0154-ruby-compat-surfaced-deviations"
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

`ViteRuby::Builder#file_digest` calls `File.stat(file)`
(`vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/builder.rb:77`) and then reads
`stat.directory?`, `stat.mtime` and `stat.size` (`:78-80`). ruby-compat's
`File.stat` is sync only, and vite-assets allows async fs only. So
`packages/vite-assets/lib/builder.ts` calls `getFs().stat` and reads the Node
stat shape (`isDirectory()`, `mtime.getTime()`), and `recently_modified?`
(`:97-99`) does the same.

## Acceptance criteria

- ruby-compat has an async `File.stat` returning a `File::Stat` (`isDirectory`,
  `mtime`, `size`), with a test.
- `fileDigest` and `isRecentlyModified` call it and read `File::Stat`, and no
  `getFs()` is left in builder.ts.
