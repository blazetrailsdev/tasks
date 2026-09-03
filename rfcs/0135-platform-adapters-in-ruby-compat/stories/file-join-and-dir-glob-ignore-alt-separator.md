---
title: "File.join and Dir.glob recognise only '/', where MRI's isdirsep also accepts '\\\\' on Windows"
status: draft
updated: 2026-09-03
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`File.join` and `Dir.glob` (`packages/ruby-compat/src/file.ts`,
`packages/ruby-compat/src/dir.ts`, landed by #7429) recognise only `/` as a
path separator. MRI recognises **two**: `isdirsep()`
(`vendor/ruby/file.c`, the macro every separator test in `file.c` and `dir.c`
routes through) is `c == '/'` on POSIX and `c == '/' || c == '\\'` on Windows,
where `File::ALT_SEPARATOR` is `"\\"` (`vendor/ruby/file.c:7428`, beside the
`File::SEPARATOR` const at `:7427`).

So on Windows the two bodies diverge from MRI:

- `rb_file_join`'s boundary arms (`vendor/ruby/file.c:5061-5067`) call
  `chompdirsep` and `isdirsep(RSTRING_PTR(tmp)[0])`, both of which see `\`.
  MRI answers `File.join("a\\", "b") #=> "a\\b"`; trails answers `"a\\/b"`,
  because its `tail = result.replace(/\/+$/, "")` and
  `tmp.startsWith(File.SEPARATOR)` only ever see `/`.
- `Dir.glob` splits its pattern on `File.SEPARATOR` alone
  (`dir.ts`'s `glob`), where `dir.c`'s `glob_make_pattern` walks with
  `isdirsep`, so a `\`-separated pattern is one literal segment in trails and
  several in MRI.

`File::SEPARATOR` itself is NOT the bug and must not be "fixed": MRI defines it
as `"/"` on every platform including Windows (`file.c:7427`), which is why
`file_store.rb` builds cache paths with `/` on Windows too. The delegating
members (`dirname`, `basename`, `extname`, `expandPath`, `isAbsolutePath`) are
already correct, because the `PathAdapter` is node's `path.win32` there and it
accepts `/` (`win32.dirname("C:/a/b") === "C:/a"`).

Found while porting the classes in #7429; not fixed there because the converged
shape has no call site or CI lane to prove it — every `runs-on` in
`.github/workflows` is `ubuntu-latest` (25/25 as of 2026-09-03).

## Converged shape

An `isdirsep`-shaped predicate in `file.ts`, mirroring the MRI macro rather
than inlining a second regex at each site, with `File.ALT_SEPARATOR` ported
beside `File.SEPARATOR` (`file.c:7427-7428`) as the platform-conditional value
the predicate reads. `File.join`'s chomp/startsWith arms and `Dir.glob`'s
pattern split both route through it.

The platform answer comes from the registered backend, not from `process` —
`ruby-compat` bans `process.*` — so the value belongs beside `PathAdapter.sep`
in the fs backend contract (`fs-adapter.ts`), which the Node registration
already fills from `node:path`.

## Acceptance criteria

- `File.join("a\\", "b")` is `"a\\b"` and `File.join("a", "\\b")` is `"a\\b"`
  when the backend reports a Windows path flavour, and every current POSIX
  assertion in `file.trails.test.ts` is unchanged.
- `Dir.glob` splits a `\`-separated pattern into segments under the same
  condition.
- `File.SEPARATOR` stays `"/"` unconditionally; only `ALT_SEPARATOR` and the
  predicate are platform-conditional.
- Tests drive the Windows arm through a registered fake backend rather than a
  Windows CI lane, since none exists.
