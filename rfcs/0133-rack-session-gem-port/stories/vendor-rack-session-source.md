---
title: "Vendor the rack-session gem at v2.1.0 so every Rack::Session citation in the tree resolves"
status: draft
updated: 2026-08-31
rfc: "0133-rack-session-gem-port"
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

Rack 3 moved `Rack::Session` into a separate `rack-session` gem. `vendor/rack`
is pinned at `v3.1.14` and has no `lib/rack/session/`, and `packages/rack`
correctly mirrors that. But Rails still depends on the gem
(`vendor/rails/actionpack/actionpack.gemspec:40`,
`vendor/rails/Gemfile.lock:440` → `rack-session (2.1.0)`;
`.../middleware/session/abstract_store.rb` opens with
`require "rack/session/abstract/id"`), and trails has been hand-rolling it
inside actionpack. Today five `@nie` markers in
`packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts`
(`:81`, `:86`, `:91`, `:96`, `:104`) carry
`rails=rack/lib/rack/session/abstract/id.rb`, a path that does not exist, and
`0104-twitter-app-full-stack-integration/cookie-store-runnable-in-a-real-stack`
cites `rack-session-2.1.0/lib/rack/session/abstract/id.rb:239-497`, which no
reviewer can open.

Story 1 of the RFC: land the anchor first, so every later story's citation
resolves. This touches no file PR 7317 touches and can land in parallel with
it.

Mirror the `rack` / `globalid` entries at `vendor/sources.ts:133-200`, including
the comment explaining why `libPath` points at the module root rather than bare
`lib` (bare `lib` would also scan the `lib/rack/session.rb` entrypoint shim):

```ts
{
  name: "rack-session",
  origin: { type: "git", url: "https://github.com/rack/rack-session.git", ref: "v2.1.0" },
  packages: [{ name: "rack-session", libPath: "lib/rack/session", testPath: "test" }],
}
```

`v2.1.0` is what the Rails Gemfile.lock resolves and sits inside both declared
ranges (actionpack `>= 1.0.1`; railties `>= 2.0.0, < 3`, `Gemfile.lock:569`).
The clone lays down 6 lib files (1,139 lines) and 7 test files. Verified
anchors: `SessionId` `abstract/id.rb:21`, `SessionHash` `:50`, `Persisted`
`:239`, `PersistedSecure` `:460`, `ID` `:499`, `Pool` `pool.rb:26`, `Cookie`
`cookie.rb:91`.

Both of this repo's extractors already run over the clone unmodified — verified
before writing this story:

```
LOCKFILE_PATH=$PWD/vendor/sources.lock.json LIB_PATHS_JSON='{"rack-session":"<clone>/lib/rack/session"}' \
  ruby scripts/api-compare/extract-ruby-api.rb
  → rack-session: 19 classes, 3 modules, 78 public methods (46 internal)
TEST_PATHS_JSON='{"rack-session":"<clone>/test"}' ruby scripts/test-compare/extract-ruby-tests.rb
  → rack-session: 7 files, 124 tests
```

So `compareApi` / `compareTests` stay ON (unlike `date` and `minitest`, which
turn them off for a C surface / a missing package dir). Enrollment itself is
`enroll-rack-session-in-compare-tooling`, not this story — this story only adds
the source.

## Acceptance criteria

- `vendor/sources.ts` gains the `rack-session` source above, with the
  module-root `libPath` comment; `vendor/sources.lock.json` updated by the
  normal `pnpm vendor:fetch` path, not hand-edited.
- `vendor/sources.test.ts` passes; `vendor/README.md` lists the new source
  alongside the other six.
- `pnpm vendor:fetch` in a fresh worktree lays down
  `vendor/rack-session/lib/rack/session/abstract/id.rb` and
  `vendor/rack-session/test/`.
- The five `@nie` markers' `rails=` paths are repointed at
  `rack-session/lib/rack/session/abstract/id.rb` **if they still exist** — PR
  7317 replaces them with `disposition=TODO`; whichever form is on `main` when
  this lands, no `@nie` in the session tree names a non-existent path.
- `0104-twitter-app-full-stack-integration/cookie-store-runnable-in-a-real-stack`'s
  Context citation is rewritten to
  `vendor/rack-session/lib/rack/session/abstract/id.rb:239-497` (a markdown
  edit in the tasks repo — story prose is markdown-owned).
- `pnpm parity:api` / `parity:test` deltas non-negative (the package is not yet
  enrolled, so both are unchanged).

## Verification

`grep -rn 'rack-session-2\.1\.0/\|rails=rack/lib/rack/session' packages/ tasks/`
returns 0.
