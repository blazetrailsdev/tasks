---
title: "Dir.glob (sync): take flags, answer '.', and stop descending symlinks under **, as MRI and Dir.globAsync do"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
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

Surfaced by trails#8318, which added `Dir.globAsync(pattern, flags)` beside the sync `Dir.glob`
(`packages/ruby-compat/src/dir.ts`). The async walker follows MRI's `glob_helper`
(`vendor/ruby/v3.3.11/dir.c:2528`); the sync `globHelper` does not, in three ways:

1. **No `flags`.** `Dir.glob(pattern)` takes one argument. MRI's `dir_s_glob`
   (`dir.c:3227`) takes `flags`, and `File::FNM_DOTMATCH` changes which entries match
   (`dir.c:325`, `dir.c:2762`).
2. **`.` is never an entry.** MRI reads `.` out of the first directory it enumerates
   (`dir.c:2705-2713`), so `Dir.glob("g/.*")` answers `["g/.", "g/.d", "g/.dot"]` under
   ruby 3.3.11. The sync `children` helper returns `readdirSync`, which has no `.`, so trails
   answers `["g/.d", "g/.dot"]`.
3. **`**`follows symlinks.** The sync walker recurses when`File.isDirectory(join(name))`,
which stats through a symlink. MRI recurses only into "not symlink but real directory"
(`dir.c:2759`): with `g/lnk -> g/a`, `Dir.glob("g/\*_/_.rb")`does not answer`g/lnk/x.rb`.

## Acceptance criteria

- [ ] `Dir.glob(pattern, flags = 0)` honours `File.FNM_DOTMATCH` exactly as `Dir.globAsync` does.
- [ ] `Dir.glob("g/.*")` answers `g/.`, and never `g/..`.
- [ ] `**` does not descend a symlinked directory.
- [ ] The two walkers share their matching rules, and a `.trails.test.ts` case asserts
      `Dir.glob(p, f)` equals `await Dir.globAsync(p, f)` over the dot/symlink fixture trails#8318
      added, whose expectations are ruby 3.3.11 output.
- [ ] Existing `Dir.glob` callers (`activerecord/src/fixtures.ts`, `migration.ts`,
      `actionview/src/template/resolver.ts`, `activesupport/src/file-update-checker.ts`) keep
      their results; none passes a `.`-leading wildcard today.
