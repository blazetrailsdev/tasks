---
title: "Vendor the rack-test gem at v2.2.0 so every Rack::Test citation in the tree resolves"
status: ready
updated: 2026-09-03
rfc: "0137-rack-test-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rack-test` is a declared runtime dependency of actionpack
(`vendor/rails/actionpack/actionpack.gemspec:41`, `s.add_dependency "rack-test",
">= 0.6.3"`), resolved at `rack-test (2.2.0)` by
`vendor/rails/Gemfile.lock:443`. Nothing under `vendor/` provides it:
`vendor/sources.ts` lists eight sources (`rails`, `rack`, `rack-session`,
`did_you_mean`, `globalid`, `date`, `minitest`) and none is rack-test.

So every `Rack::Test` citation in the tree is unresolvable today:
`packages/actionpack/src/action-dispatch/testing/integration.ts:1065-1070`
("Rack::Test lives outside Rails so there is no file to port"),
`.../action-controller/test-case.ts:670` ("Mirrors Rails
Rack::Test::Utils.build_multipart"), and
`.../action-dispatch/testing/test-process.ts:63,88`.

Story 1 of the RFC: land the anchor first, so every later story's citation
resolves. Mirror the `rack` / `rack-session` entries at
`vendor/sources.ts:147-179`.

```ts
{
  name: "rack-test",
  origin: { type: "git", url: "https://github.com/rack/rack-test.git", ref: "v2.2.0" },
  packages: [
    {
      name: "rack-test",
      libPath: "lib/rack/test",
      libEntryFile: "lib/rack/test.rb",
      testPath: "spec",
    },
  ],
}
```

**The `libEntryFile` is the part that differs from its two siblings and needs
its own comment.** `rack` and `rack-session` point `libPath` at the module root
specifically to _exclude_ the entrypoint shim beside it. rack-test's entrypoint
is not a shim: `lib/rack/test.rb` is 382 lines and defines `Session` (`:53`),
`Error` (`:45`), `DEFAULT_HOST` (`:33`) and `MULTIPART_BOUNDARY` (`:36`). The
module-root `libPath` is kept for path mapping and the entry file recovered
through `libEntryFile`, the mechanism `arel` already uses for
`activerecord/lib/arel.rb` (`vendor/sources.ts:83`). `testPath` is `spec`,
not `test`.

The clone lays down 6 lib files (987 lines: `test.rb` 382, `cookie_jar.rb` 251,
`utils.rb` 156, `uploaded_file.rb` 99, `methods.rb` 94, `version.rb` 5) and 8
spec files. Verified anchors at `v2.2.0`: `Session` `test.rb:53`, `Error`
`test.rb:45`, `Cookie` `cookie_jar.rb:10`, `CookieJar` `cookie_jar.rb:134`,
`Utils` `utils.rb:5`, `UploadedFile` `uploaded_file.rb:14`, `Methods`
`methods.rb:24`.

Both extractors already run over the clone unmodified — verified before writing
this story:

```console
API_COMPARE_FORCE=1 LOCKFILE_PATH=$PWD/vendor/sources.lock.json \
  LIB_PATHS_JSON='{"rack-test":"<clone>/lib/rack/test"}' \
  LIB_ENTRY_FILES_JSON='{"rack-test":"<clone>/lib/rack/test.rb"}' \
  ruby scripts/api-compare/extract-ruby-api.rb
  → rack-test: 5 classes, 4 modules, 90 public methods (17 internal)
TEST_PATHS_JSON='{"rack-test":"<clone>/spec"}' ruby scripts/test-compare/extract-ruby-tests.rb
  → rack-test: 8 files, 234 tests
```

So `compareApi` / `compareTests` stay ON. Enrollment itself is
`enroll-rack-test-in-compare-tooling`, not this story.

## Acceptance criteria

- [ ] `vendor/sources.ts` gains the source above, with a comment explaining why
      `libEntryFile` is set here and not on `rack` / `rack-session`.
- [ ] `vendor/sources.lock.json` updated by the normal `pnpm vendor:fetch` path,
      not hand-edited.
- [ ] `vendor/sources.test.ts` passes; `vendor/README.md` lists rack-test alongside
      the other eight.
- [ ] `pnpm vendor:fetch` in a fresh worktree lays down
      `vendor/rack-test/lib/rack/test.rb` and `vendor/rack-test/spec/`.
- [ ] `pnpm parity:api` / `parity:test` deltas non-negative (the package is not yet
      enrolled, so both are unchanged).

## Definition of done

Hand-editing `vendor/sources.lock.json` does not close this story — the lock
row comes from `pnpm vendor:fetch`. Setting `compareApi: false` or
`compareTests: false` to avoid the day-one 0% rows also does not close it: both
extractors were verified working, so the weaker contract buys nothing.
