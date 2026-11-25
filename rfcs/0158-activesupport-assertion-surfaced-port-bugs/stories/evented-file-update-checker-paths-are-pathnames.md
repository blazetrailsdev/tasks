---
title: "EventedFileUpdateChecker::Core holds paths as Pathnames, as Rails does"
status: draft
updated: 2026-11-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`EventedFileUpdateChecker::Core` (`packages/activesupport/lib/evented-file-update-checker.ts`) keeps every path as a `string`. Rails holds them as `Pathname`s throughout (`vendor/rails/v8.0.5.2/activesupport/lib/active_support/evented_file_update_checker.rb`):

- `:76` `@files = files.map { |file| Pathname(file).expand_path }.to_set`
- `:78-80` `@dirs` keyed by `Pathname(dir).expand_path`
- `:137-139` `normalize_dirs!` `dir.exist? ? dir.realpath : dir`
- `:149-168` `watching?` `Pathname(file)`, `file.dirname.ascend`, `dir == @common_path || dir.root?`
- `:171` `directories_to_watch` `@dirs.keys | @files.map(&:dirname)`
- `common_path` walks `Pathname#ascend`

The port goes through `File.expandPath` / `File.realpath` / `File.dirname` on strings, and uses `Pathname` only inside `isWatching`. ruby-compat's `Pathname` now has `ascend`, `isRoot`, `expandPath`, `realpath` and `dirname`.

## Acceptance criteria

- `files`, the keys of `dirs`, and `_commonPath` hold `Pathname`s, built with `new Pathname(x).expandPath()` as Rails does.
- `normalizeDirsBang`, `isWatching`, `directoriesToWatch` and `commonPath` call the `Pathname` methods Rails calls. Set and Map membership is keyed on `Pathname#hash`/`eql`, or `to_s` where JS identity forces it, and that choice is justified at the call site.
- `pnpm parity:api:calls` / `:calls:args` for `evented_file_update_checker.rb` show no new rows, and `test/evented-file-update-checker.test.ts` passes.
