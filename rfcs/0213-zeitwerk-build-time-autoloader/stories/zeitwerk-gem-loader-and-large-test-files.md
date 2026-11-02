---
title: "zeitwerk-gem-loader-and-large-test-files"
status: draft
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

zeitwerk-remaining-test-suite shipped the small test files, `Loader.allDirs` and `withLoader`. The ceiling left this out.

Port `lib/zeitwerk/gem_loader.rb`, `Loader.for_gem` / `for_gem_extension` (`loader.rb:389,410`), `Registry.loader_for_gem` (`registry.rb:52`).
Findings from a working draft:

- `GemLoader` `extends Loader` and registry.ts imports loader's cycle, so seat it (`Registry.GemLoader = GemLoader`) rather than importing it in registry.ts.
- `push_dir` is async, so `gem_loader.rb:29` runs in the async `__new`; `loaderForGem` and `forGem` return promises.
- `caller_locations(1,1).first.path` is `excBacktraceLocations(new Error())`; a frame is a `file:` URL with `?zeitwerk=N`, so convert with `fileURLToPath`.
- `GemInflector` hardcodes `.rb` (`gem-inflector.ts`): use `File.basename(rootFile, ".*")` and the root file's extname, or `version.ts` never inflects to VERSION.
- A temp file reaches the loader through a `globalThis.$Loader` seat; `$get` is on `test-helpers/loader-test.ts`. Symlinks: `File.symlinkAsync`.

Test files still to port: test_for_gem.rb, test_for_gem_extension.rb, test_callbacks.rb, test_top_level.rb, test_utf8.rb, test_eager_load_dir.rb, test_eager_load_namespace.rb, test_load_file.rb, test_logging.rb (about 137 tests). Use `get(Object, ...)`, not `TopLevel`.

## Acceptance criteria

- `parity:test` for `zeitwerk` matches these files; `parity:api` matches gem_loader.rb, for_gem, for_gem_extension and loader_for_gem.
- A file too large for one PR is filed as its own story.
