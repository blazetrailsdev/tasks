---
title: "File and Dir are the surface: the Ruby classes ported onto the relocated fs backend, with cache/file-store as the proof body"
status: ready
updated: 2026-09-02
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: ["move-fs-adapter-into-ruby-compat-as-a-backend-contract"]
deps-rfc: []
est-loc: 320
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The Ruby surface over the relocated fs backend. Rails reaches the filesystem
through `File` and `Dir`; trails reaches it through members named after node's
`fs`, so a body making exactly the Rails call does not read as one.

The live evidence is a comment that exists because the code cannot say what it
means — `packages/activesupport/src/cache/file-store.ts:291,311-318` reads
"Rails compares `File.realpath(dir) == File.realpath(cache_path)`" sitting above
`fs.realpathSync`. Rails' own line is `cache/file_store.rb:123,133,201,205`
(`File.exist?`).

Names come from `rubyMethodToTs` (`scripts/parity/conventions.ts`), verified
2026-09-02 — `exist?` → `isExist`, `directory?` → `isDirectory`, `file?` →
`isFile`, `expand_path` → `expandPath`, `absolute_path?` → `isAbsolutePath`;
`join`, `dirname`, `basename`, `extname`, `read`, `write`, `realpath`, `glob`
unchanged. `File.join` is the Ruby seat for what is spelled `getPath().join`
today (21 calls), which is why `PathAdapter`'s members land on `File` rather
than on a `Path` class Ruby does not have. `Pathname` is a separate class and
out of scope here.

Members to port are the ones ported bodies actually call — the workspace census
(non-test, 2026-09-02) is `writeFileSync` 269, `readFileSync` 182, `existsSync`
170, `mkdirSync` 81, `unlinkSync` 44, `statSync` 18, `readdirSync` 17,
`realpathSync` 6; on the path side `join` 21, `resolve` 14, `extname` 7,
`dirname` 7, `basename` 6, `sep` 3. RFC 0129's standing rule holds: a member
with no call site is not ported.

`getFs()` / `getPath()` stay alive through this story — the call-site flips are
their own stories, per package, and the exemption does not move until they are
all done.

## Acceptance criteria

- `packages/ruby-compat/src/file.ts` and `dir.ts` export `File` and `Dir` as
  classes with static members, backed by the fs backend contract, each member
  carrying an MRI citation and each class a `@noRailsEquivalent PERMANENT`
  receipt.
- Semantics match MRI, not node: `File.isExist` on a broken symlink, `File.join`
  on an absolute second component, and `Dir.glob` ordering each have a test
  citing `vendor/ruby`. Run `ruby` to confirm rather than deriving.
- `cache/file-store.ts` is flipped as the proof body and its "Rails compares …"
  comment is deleted, because the code now says it.
- `pnpm parity:api:extra:gate` green with `novel` still 0.
