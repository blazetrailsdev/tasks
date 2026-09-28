---
title: "Vendor the rack-cache gem at v1.17.0 so every Rack::Cache citation resolves"
status: draft
updated: 2026-09-28
rfc: "0000-rack-cache-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Story 1 of the RFC. Rails reaches `rack-cache` from
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/rack_cache.rb:7-8,12,36`
and `vendor/rails/v8.0.2/railties/lib/rails/application/default_middleware_stack.rb:37-40,113-132`,
and pins it at `rack-cache (1.17.0)` (`vendor/rails/v8.0.2/Gemfile.lock:434`;
`vendor/rails/v8.0.2/Gemfile:18`, `gem "rack-cache", "~> 1.2"`). Nothing under
`vendor/` provides it, so neither story that ports a Rails consumer
(`port-rails-meta-and-entity-stores`, `default-middleware-stack-omits-rack-cache`)
can cite a line of the gem.

Mirror the `rack-test` entry in `vendor/sources.ts:186-213`:

```ts
{
  name: "rack-cache",
  origin: { type: "git", url: "https://github.com/rack/rack-cache.git", ref: "v1.17.0" },
  packages: [
    {
      name: "rack-cache",
      libPath: "lib/rack/cache",
      libEntryFile: "lib/rack/cache.rb",
      testPath: "test",
    },
  ],
}
```

Two comments belong on the entry:

- **The ref.** `v1.17.0` is what `Gemfile.lock:434` resolves, inside the
  Gemfile's `~> 1.2`. rack-cache is **not** a gemspec dependency of actionpack
  or railties, unlike `rack-session` / `rack-test`
  (`actionpack.gemspec:40-41`). Say so, because the package-shape decision in
  the RFC (optional peer, not a plain dependency) rests on it.
- **`libEntryFile`.** As with `rack-test`, the file beside the module root is
  not a shim. `lib/rack/cache.rb:42-44` defines `Rack::Cache.new`, which is
  what `middleware.use ::Rack::Cache` reaches.

Git, not RubyGems: the published `.gem` ships no `test/`
(`rack-cache.gemspec`, `s.files = git ls-files lib/ README.md MIT-LICENSE`).
The git tag's `lib/` is byte-identical to the `.gem`'s (verified with
`diff -r`). The tree lands at `vendor/rack-cache/v1.17.0/`, RFC 0159's
versioned layout.

The clone lays down 16 lib files (1,588 lines) and 10 test files plus
`test/test_helper.rb`. Both extractors already run over it unmodified. These
runs were verified before this story was written:

```console
RUBY_API_OUTPUT_PATH=<scratch>/rc-api.json LOCKFILE_PATH=$PWD/vendor/sources.lock.json \
  LIB_PATHS_JSON='{"rack-cache":"<clone>/lib/rack/cache"}' \
  LIB_ENTRY_FILES_JSON='{"rack-cache":"<clone>/lib/rack/cache.rb"}' \
  ruby scripts/api-compare/extract-ruby-api.rb
  → rack-cache: 23 classes, 5 modules, 158 public methods (40 internal)
TEST_PATHS_JSON='{"rack-cache":"<clone>/test"}' ruby scripts/test-compare/extract-ruby-tests.rb
  → rack-cache: 10 files, 226 tests
```

So `compareApi` / `compareTests` stay on. Enrollment itself is
`enroll-rack-cache-in-compare-tooling`.

## Acceptance criteria

- [ ] `vendor/sources.ts` gains the source above, with the two comments.
- [ ] `vendor/sources.lock.json` is updated by `pnpm vendor:fetch`, not by hand.
- [ ] `vendor/sources.test.ts` passes, and `vendor/README.md` lists rack-cache
      with the other sources.
- [ ] `pnpm vendor:fetch` in a fresh worktree lays down
      `vendor/rack-cache/v1.17.0/lib/rack/cache.rb` and
      `vendor/rack-cache/v1.17.0/test/`.
- [ ] The Context of `0164-actiondispatch-http-parity/port-rails-meta-and-entity-stores`
      and `0142-trailties-surfaced-deviations/default-middleware-stack-omits-rack-cache`
      cites the gem at `vendor/rack-cache/v1.17.0/lib/rack/cache/…:LINE`. This is a
      markdown edit in the tasks repo.
- [ ] `pnpm parity:api` / `parity:test` deltas are non-negative. The package is
      not enrolled yet, so both are unchanged.

## Definition of done

Hand-editing `vendor/sources.lock.json` does not close this story. Neither does
setting `compareApi: false` or `compareTests: false` to avoid the day-one 0%
rows: both extractors were verified working.
