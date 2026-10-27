---
title: "ActiveSupport::Logger.normalize_sources calls source.path, not a path property"
status: draft
updated: 2026-10-27
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveSupport::Logger.normalize_sources`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/logger.rb:39-45`) is
`source = source.path if source.respond_to?(:path)`: a File / IO / Tempfile
answers `path` as a method. trails' `Logger.normalizeSources`
(`packages/activesupport/src/logger.ts`) instead tests
`typeof source.path === "string"`, so it reads only a plain object's `path`
_property_. A ruby-compat `File`, `IO` or `Tempfile`, whose `path()` is a method
(`packages/ruby-compat/src/io.ts:743`, `tempfile.ts:167`), is never normalized to
its path. So `Logger.isLoggerOutputsTo(logger, file)` misses a logger opened on
that file's path, and trailties' `commands/server.ts:78`
(`isLoggerOutputsTo(Trails.logger!, STDERR, STDOUT)`) compares IO objects only by
identity. The test "log outputs to with a filename"
(`packages/activesupport/src/logger.test.ts`) passes a plain `{ path }` where
Rails passes a `Tempfile` (`activesupport/test/logger_test.rb:42-54`).

## Acceptance criteria

- `normalizeSources` is `if (rbObjRespondTo(source, "path")) source = source.path()`
  as in `logger.rb:41`, then the `File.exist?` / `realpath` arm unchanged.
- "log outputs to with a filename" builds `t` as a ruby-compat `Tempfile`
  (`Tempfile.new(["development", "log"])`) like Rails, and the test passes unchanged otherwise.
