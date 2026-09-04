---
title: "File.fnmatch lands on ruby-compat's File, and actionview's HashResolver stops compiling its own glob RegExp"
status: ready
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::Testing::Resolvers::HashResolver#template_glob`
(`actionview/lib/action_view/testing/resolvers.rb:26-30`) is

```ruby
def template_glob(glob)
  @hash.keys.filter_map do |path|
    "/#{path}" if File.fnmatch(glob, path)
  end
end
```

`packages/actionview/src/testing/resolvers.ts:35-40` cannot spell that call:
ruby-compat's `File` has no `fnmatch`, so the port compiles the glob to a
`RegExp` once through the resolver's own `fnmatch(glob)` helper and tests each
path against it. PR #7462 baselined the resulting call-argument row
(`actionview/testing/resolvers.json`, `fnmatch(ref:glob, ref:path)`) when `File`
left `CORE_CLASS_RECEIVERS` and the argument list became visible to the gate.

The private helper is also extra surface the resolver would not need if
`File.fnmatch` existed.

## Acceptance criteria

- `File.fnmatch(pattern, path, flags = 0)` on `packages/ruby-compat/src/file.ts`,
  citing `vendor/ruby/dir.c:3554` (`rb_file_fnmatch`) and carrying a
  `@noRailsEquivalent PERMANENT` receipt, beside `File.basename` / `File.extname`.
- The glob syntax Rails' resolvers actually use is covered: `*` (no `/`), `**/`,
  `?`, `[...]` character classes and `{a,b}` alternation, plus `File::FNM_EXTGLOB`
  if a call site needs it. Ruby's `*` does NOT cross `/` without `FNM_PATHNAME`
  being off — match MRI, and check the arms with `ruby -e` rather than deriving them.
- `resolvers.ts` `template_glob` calls `File.fnmatch(glob, path)` per key, in
  Rails' argument order, and its bespoke `fnmatch(glob)` RegExp helper is deleted.
- The `fnmatch(ref:glob, ref:path)` row is removed from
  `scripts/api-compare/call-mismatches-exclude/actionview/testing/resolvers.json`
  (only-shrink: delete the row by hand, do not reseed), and
  `pnpm parity:api:calls:args` is green.
- `parity:api:extra:gate` does not rise — ruby-compat is pinned at 0 novel, so
  the new member needs its receipt.
