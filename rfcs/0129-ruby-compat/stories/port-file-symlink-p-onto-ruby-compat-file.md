---
title: "File.symlink? lands on ruby-compat's File, retiring the last FsAdapter helper in Rails::Paths::Path"
status: done
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 8
pr: 7485
claim: "2026-09-04T15:50:46Z"
assignee: "route-remaining-default-env-call-sites"
blocked-by: null
closed-reason: null
---

## Context

`Rails::Paths::Path#existent` (`railties/lib/rails/paths.rb:219-229`) is

```ruby
def existent
  expanded.select do |f|
    does_exist = File.exist?(f)

    if !does_exist && File.symlink?(f)
      raise "File #{f} is a symlink that does not point to a valid file"
    end
    does_exist
  end
end
```

`packages/trailties/src/paths.ts` cannot spell `File.symlink?`: ruby-compat's
`File` has no `symlink?`, so the port reaches through the `FsAdapter` — `fs.lstat`
plus `isSymbolicLink()` in a local `isSymlink(fs, p)` helper — where Rails asks
`File` directly. PR #7462 baselined the call-argument row
(`trailties/paths.json`, `symlink?(ref:f)`) when `File` left
`CORE_CLASS_RECEIVERS`.

The sibling arm of the same method already converged in #7462:
`existent_directories` and `expanded` now call `File.isDirectory` /
`File.expandPath`, and their `isDir(fs, …)` helper is gone. `existent` is the
one arm left holding an adapter helper, and `File.symlink?` is what removes it.

## Acceptance criteria

- `File.isSymlink(fileName)` on `packages/ruby-compat/src/file.ts` — the
  `docs/ruby-ts-conventions.md` spelling of `File.symlink?` — citing
  `vendor/ruby/file.c:1723` (`rb_file_symlink_p`) and carrying a
  `@noRailsEquivalent PERMANENT` receipt. It answers `false` rather than raising
  on a failed lstat, the way its `File.isDirectory` neighbour does.
- `paths.ts` `existent` calls `File.isExist(f)` and `File.isSymlink(f)` in Rails'
  order and keeps Rails' message verbatim; the `isSymlink(fs, p)` helper and the
  `Fs` type alias it needs are deleted if nothing else uses them.
- The `symlink?(ref:f)` row is removed from
  `scripts/api-compare/call-mismatches-exclude/trailties/paths.json` (only-shrink:
  delete by hand, no reseed) and `pnpm parity:api:calls:args` is green.
- `paths.test.ts`'s "A failed symlink is still a valid file" keeps its name and
  its fake adapter gains whatever sync member `File.isSymlink` reads.
