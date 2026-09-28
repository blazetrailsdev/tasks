---
rfc: "0000-rack-cache-gem-port"
title: "@blazetrails/rack-cache: vendor the rack-cache gem and port it as its own package"
status: draft
created: 2026-09-28
updated: 2026-09-28
owner: "@deanmarano"
packages:
  - rack-cache
  - actionpack
  - trailties
clusters:
  - fidelity
related-rfcs:
  - "0133-rack-session-gem-port"
  - "0137-rack-test-gem-port"
  - "0164-actiondispatch-http-parity"
  - "0142-trailties-surfaced-deviations"
  - "0158-activesupport-assertion-surfaced-port-bugs"
priority: 30
---

# RFC — `@blazetrails/rack-cache`

## Summary

Rails reaches the `rack-cache` gem from three files, and trails has none of it:
no vendored source, no package, no `Rack::Cache` anywhere in `packages/`, and a
`config.actionDispatch.rackCache` setting
(`packages/trailties/src/trailties/action-dispatch.ts:27`) that nothing reads.

This RFC vendors `rack-cache` at `v1.17.0`, the version Rails pins, creates
`packages/rack-cache`, and ports the gem against its own 226-case suite. It
follows RFC 0133 (`rack-session`) and RFC 0137 (`rack-test`) story for story:
vendor, skeleton, compare-tooling enrollment, CI lanes, then the port. Porting
the two Rails subclasses and mounting the middleware stay with the two stories
already filed for them, which now depend on this RFC.

**Priority is low.** Rails defaults `rack_cache` to `false`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/railtie.rb:20`), so a
default trails app never mounts it. Every other default-middleware gap comes
first. The RFC and its stories are seeded at priority 30.

## Motivation

### Where Rails reaches the gem

| Rails file:line                                                                          | what it names                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/rack_cache.rb:7-8,12,36`        | `require "rack/cache"`, `"rack/cache/context"`; `RailsMetaStore < Rack::Cache::MetaStore`, `RailsEntityStore < Rack::Cache::EntityStore`                                                     |
| `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/rack_cache.rb:33,65`            | `::Rack::Cache::MetaStore::RAILS = self`, `::Rack::Cache::EntityStore::RAILS = self`: the `rails:/` URI scheme                                                                               |
| `vendor/rails/v8.0.2/railties/lib/rails/application/default_middleware_stack.rb:37-40`   | `middleware.use ::Rack::Cache, rack_cache`, between `ActionDispatch::Static` and `Rack::Lock`                                                                                                |
| `vendor/rails/v8.0.2/railties/lib/rails/application/default_middleware_stack.rb:113-132` | `load_rack_cache`: `require "rack/cache"` rescuing `LoadError` with "Be sure to add rack-cache to your Gemfile"; `true` → `{ metastore: "rails:/", entitystore: "rails:/", verbose: false }` |
| `vendor/rails/v8.0.2/actionpack/lib/action_dispatch/railtie.rb:20`                       | `config.action_dispatch.rack_cache = false`                                                                                                                                                  |

The whole surface Rails touches is `Rack::Cache.new` (via `middleware.use`),
the `MetaStore` / `EntityStore` base classes, `EntityStore#slurp`, and the
scheme-constant lookup in `Storage#create_store` that makes `rails:/` resolve to
`RAILS`.

### It is an optional gem, not a declared dependency

This is where rack-cache differs from both precedents. `rack-session` and
`rack-test` are `add_dependency` entries in `actionpack.gemspec:40-41`.
`rack-cache` is in neither gemspec: it appears only in Rails' development
`Gemfile` (`vendor/rails/v8.0.2/Gemfile:18`, `gem "rack-cache", "~> 1.2"`),
resolved to `rack-cache (1.17.0)` at `vendor/rails/v8.0.2/Gemfile.lock:434`.
An app opts in by adding it to its own Gemfile, and `load_rack_cache` raises a
`LoadError` hint when it is missing. So the package is **published**, like its
siblings, but actionpack and trailties take it as an **optional peer
dependency**, not a plain one (see "Package shape").

### What it costs, measured

The two extractors were run over a clone of `rack/rack-cache` at tag `v1.17.0`
(commit `5261d91b21`) with no change to either script. The gem's `lib/` is
identical to the published `rack-cache-1.17.0.gem`.

```console
$ RUBY_API_OUTPUT_PATH=<scratch>/rc-api.json LOCKFILE_PATH=$PWD/vendor/sources.lock.json \
  LIB_PATHS_JSON='{"rack-cache":"<clone>/lib/rack/cache"}' \
  LIB_ENTRY_FILES_JSON='{"rack-cache":"<clone>/lib/rack/cache.rb"}' \
  ruby scripts/api-compare/extract-ruby-api.rb
Processing rack-cache: 16 files...
  rack-cache: 23 classes, 5 modules, 158 public methods (40 internal)

$ TEST_PATHS_JSON='{"rack-cache":"<clone>/test"}' ruby scripts/test-compare/extract-ruby-tests.rb
  rack-cache: 10 files, 226 tests
Total: 226 tests across 10 files (0 adapter/feature-gated)
```

That is 158 public methods and 226 test cases, all measured against zero today.
The suite is minitest-spec (`maxitest`, `test/test_helper.rb:8-9`), which
`extract-ruby-tests.rb` already handles.

The trails side also carries two consequences:

- `port-rails-meta-and-entity-stores` (RFC 0164) is draft at 450 LOC because it
  folds vendoring, the gem's base classes and the Rails subclasses into one PR.
  `http/rack_cache.rb` reads 0/6 in `parity:api --package actiondispatch`.
- `default-middleware-stack-omits-rack-cache` (RFC 0142) cannot converge
  `buildStack` without a `Rack::Cache` to mount.

## Design

### The gem, file by file

`lib/` at `v1.17.0`, 1,588 lines. Paths are relative to `lib/rack/cache/`
unless noted.

| Ruby file                                                                                             | lines | defines                                                                                                                                                                                                                                                                                                                                                               | disposition                             |
| ----------------------------------------------------------------------------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `lib/rack/cache.rb`                                                                                   |    45 | `Rack::Cache.new(backend, options={}, &b)` (`:42-44`) → `Context.new`; `autoload`s (`:30-34`)                                                                                                                                                                                                                                                                         | port (entry file, `libEntryFile`)       |
| `context.rb`                                                                                          |   329 | `Context` (`:9`): `include Options` (`:10`), `initialize` (`:18`), `metastore`/`entitystore` (`:33`,`:40`), `call`/`call!` (`:48`,`:58`), private `pass`/`invalidate`/`lookup`/`validate`/`fetch`/`store` and helpers (`:102-328`)                                                                                                                                    | port                                    |
| `options.rb`                                                                                          |   169 | `Options` module (`:10`): `option_accessor` (`:13-18`) × 12 options (`:31-112`), `options`/`options=`/`set` (`:118-140`), private `initialize_options`/`read_option`/`write_option` (`:143-168`)                                                                                                                                                                      | port                                    |
| `cache_control.rb`                                                                                    |   209 | `CacheControl < Hash` (`:6`): directive predicates and readers (`:18-182`), `to_s` (`:184`), private `parse` (`:198`)                                                                                                                                                                                                                                                 | port                                    |
| `request.rb`                                                                                          |    33 | `Request < Rack::Request` (`:12`): `request_method`, `cache_control`, `no_cache?`                                                                                                                                                                                                                                                                                     | port                                    |
| `response.rb`                                                                                         |   268 | `Response` (`:21`): `include Rack::Response::Helpers` (`:22`), freshness/TTL/validator logic, `CACHEABLE_RESPONSE_CODES` (`:55`), `NOT_MODIFIED_OMIT_HEADERS` (`:227`)                                                                                                                                                                                                | port                                    |
| `headers.rb`                                                                                          |    21 | `Headers = ::Rack::Headers` + `Rack::Cache.Headers(headers)` (`:3-8`, the Rack 3 arm); `Rack::Utils::HeaderHash` arm (`:9-20`, Rack < 3)                                                                                                                                                                                                                              | port the Rack 3 arm only                |
| `key.rb`                                                                                              |    68 | `Key` (`:4`): `query_string_ignore` class accessor (`:18-20`), `.call` (`:24`), `generate` (`:33`), private `query_string` (`:57`)                                                                                                                                                                                                                                    | port                                    |
| `meta_store.rb`                                                                                       |   443 | `MetaStore` (`:23`): `lookup`/`store`/`cache_key`/`invalidate` (`:28-131`), protected abstract `read`/`write`/`purge` (`:167-187`), `hexdigest` (`:192`); `Heap` (`:199`), `Disk` (`:236`), `MemCacheBase` (`:295`), `Dalli` (`:334`), `MemCached` (`:362`), `GAEStore` (`:408`); scheme constants `HEAP`/`MEM`/`DISK`/`FILE`/`MEMCACHE`/`MEMCACHED`/`GAECACHE`/`GAE` | port all but `MemCached` and `GAEStore` |
| `entity_store.rb`                                                                                     |   371 | `EntityStore` (`:8`): private `slurp`/`bytesize` (`:14-31`); `Heap` (`:35`), `Disk` (`:83`, with `Disk::Body < ::File` `:105`), `MemCacheBase` (`:172`), `Dalli` (`:209`), `MemCached` (`:245`), `GAEStore` (`:288`), `Noop` (`:341`); scheme constants                                                                                                               | port all but `MemCached` and `GAEStore` |
| `storage.rb`                                                                                          |    65 | `Storage` (`:12`): `resolve_metastore_uri`/`resolve_entitystore_uri`/`clear`, private `create_store` (`:34-56`), `Storage.instance` singleton (`:60-63`)                                                                                                                                                                                                              | port                                    |
| `app_engine.rb`                                                                                       |    48 | `AppEngine::MC` / `AppEngine::MemCache`: `require 'java'`, `com.google.appengine.api.memcache.*`                                                                                                                                                                                                                                                                      | **skip** (JRuby on Google App Engine)   |
| `version.rb`                                                                                          |     5 | `VERSION = '1.17.0'`                                                                                                                                                                                                                                                                                                                                                  | port (skeleton story)                   |
| `appengine.rb`, `cachecontrol.rb`, `entitystore.rb`, `metastore.rb` (2 each), `lib/rack-cache.rb` (1) |     9 | deprecated `require` aliases that `warn` and re-require                                                                                                                                                                                                                                                                                                               | **skip**: nothing to port               |

### Backends: what each maps to in trails

The store backends are the part of the gem that talks to the outside world, so
each one is decided here rather than in its story.

| Backend (URI scheme)                 | Ruby                                                                                                                                                                                        | trails                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `heap:/`, `mem:/`                    | a Ruby `Hash` (`meta_store.rb:199-232`, `entity_store.rb:35-80`)                                                                                                                            | a trails `Hash` / `Map`. Pure, no I/O.                                                                                                                                                                                                                                                                                                 |
| `file:`, `disk:`                     | `File` / `FileUtils` / `Digest::SHA1` (`meta_store.rb:236-290`, `entity_store.rb:83-169`)                                                                                                   | `File`, `FileUtils` and `Digest::SHA1` from `@blazetrails/ruby-compat` (`src/file.ts`, `src/file-utils.ts`, `src/digest.ts:91`), through its `getFs` seat, so it runs wherever that seat is filled.                                                                                                                                    |
| `noop:`                              | `EntityStore::Noop` (`entity_store.rb:332-368`)                                                                                                                                             | pure, no I/O.                                                                                                                                                                                                                                                                                                                          |
| `memcache:`, `memcached:`            | `Dalli` over `::Dalli::Client` (`meta_store.rb:334-360`, `entity_store.rb:209-243`); `MEMCACHE` picks `MemCached` only when `::Memcached` is loaded (`meta_store.rb:400-406`), else `Dalli` | `Dalli` over an **npm memcached client declared as an optional peer** of `@blazetrails/rack-cache`, async from its first PR. This is the `pg` / `mysql2` precedent in `packages/activerecord/package.json` and the rule `cache-store-async-over-npm-clients` (RFC 0158) sets for `MemCacheStore`. There are no empty `TopLevel` seats. |
| `memcached:` via the `memcached` gem | `MemCached` (`meta_store.rb:362-398`, `entity_store.rb:245-283`), a libmemcached C binding                                                                                                  | **skip.** `MEMCACHE` resolves to `Dalli` whenever `::Memcached` is undefined, which in trails is always. One memcached client is the whole memcache surface, and `Dalli` is the one Rails' own test suite loads (`rack-cache.gemspec` dev-dep `dalli`).                                                                                |
| `gae:`, `gaecache:`                  | `GAEStore` (`meta_store.rb:408-439`, `entity_store.rb:288-331`) over `AppEngine::MemCache`                                                                                                  | **skip.** Java-only (`app_engine.rb:5-13`). Its tests are already `need_java`-guarded (`test/entity_store_test.rb:250`).                                                                                                                                                                                                               |
| `rails:/`                            | `ActionDispatch::RailsMetaStore` / `RailsEntityStore` over `Rails.cache`                                                                                                                    | **not this RFC.** `0164-actiondispatch-http-parity/port-rails-meta-and-entity-stores`, which depends on this RFC's store stories.                                                                                                                                                                                                      |

### Async from the start

A trails Rack middleware's `call` is already `async`
(`packages/rack/src/conditional-get.ts:13`, `packages/rack/src/etag.ts:18`), so
`Context#call` / `call!` are async and cost no cascade. Every store operation is
async too: `MetaStore#lookup` / `store` / `invalidate` and the protected
`read` / `write` / `purge`, and `EntityStore#open` / `read` / `write` /
`exist?` / `purge`. This is the settled shape for gem-backed stores, not a
per-backend choice. The memcache backends cannot be anything else, and the
Heap, Disk and Noop backends share the base-class signatures that `Context`
awaits. It also means the `rails:/` stores can `await` `Rails.cache` whether or
not `cache-store-async-over-npm-clients` has made it async yet.

### The vendor entry

A new source in `vendor/sources.ts`, beside `rack-test`:

```ts
{
  name: "rack-cache",
  origin: {
    type: "git",
    url: "https://github.com/rack/rack-cache.git",
    ref: "v1.17.0",
  },
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

`libPath` is the module root, as it is for `rack`, `rack-session` and
`rack-test`. Like `rack-test`, the entry file is **not** a shim:
`lib/rack/cache.rb:42-44` defines `Rack::Cache.new`, the method
`middleware.use ::Rack::Cache` reaches, so it is recovered through
`libEntryFile`. The extractor run above used exactly this pair. The tree lands at
`vendor/rack-cache/v1.17.0/` under RFC 0159's versioned layout.

### Package shape

`packages/rack-cache/` is modelled on `packages/rack-test/`: published (no
`"private": true`), `@blazetrails/rack-cache` at `0.1.0`, with the four
cross-package registrations RFC 0137 lists (root `tsconfig.json` reference,
both `vitest.config.ts` aliases with the subpath entry above the bare one,
`vitest.dx-tests.config.ts` if referenced). The workspace `packages/*` glob
already covers `pnpm-workspace.yaml`.

Dependencies:

- `@blazetrails/rack`: the gem's only runtime dependency
  (`rack-cache.gemspec`, `s.add_dependency 'rack', '>= 0.4'`). The port reaches
  `Rack::Request` (`request.rb:12`), `Rack::Response::Helpers` (`response.rb:22`,
  `packages/rack/src/response.ts:20`), `Rack::Headers` (`headers.rb:5`,
  `packages/rack/src/headers.ts:3`) and `Rack::Utils` `escape` / `unescape` /
  `parse_query` (`key.rb:5`, `meta_store.rb:296`, `packages/rack/src/utils.ts:85,99,103`).
- `@blazetrails/ruby-compat`: the stdlib it requires. That is `fileutils` and
  `digest/sha1` (`meta_store.rb:1-2`, `entity_store.rb:1`), `uri`
  (`storage.rb:2`), and `tmpdir` in the test harness
  (`test/test_helper.rb:3`, `:196-213`).
- `@blazetrails/activesupport`, added by `port-rack-cache-disk-stores` only if
  Open question 2 resolves that way. `MetaStore::Disk` persists entries with
  `Marshal.load` / `Marshal.dump` (`meta_store.rb:246,255`). ruby-compat has no
  `Marshal`, and trails' Marshal stand-in is activesupport's cache `coder`
  (`packages/activesupport/src/cache/coder.ts:104`, exported through
  `@blazetrails/activesupport/cache/*`). `rack-session` and `rack-test` already
  carry the same activesupport edge for `Tempfile`.
- An npm memcached client: **optional peer**, added by the memcache story only.

actionpack and trailties take `@blazetrails/rack-cache` as an **optional peer
dependency** plus a workspace `devDependency`, mirroring Rails' Gemfile-only
dependency. `packages/activerecord/package.json` does the same with `pg`,
`mysql2` and the SQLite drivers. Neither package imports it from an eagerly
loaded module. `http/rack_cache.rb` is `:enddoc:` and loaded only by
`load_rack_cache` (`default_middleware_stack.rb:38`). So the trails port loads
it lazily from that one site, and the failure arm appends Rails' "Be sure to
add rack-cache to your Gemfile" hint. Rails' `require` is synchronous, but
trails' `DefaultMiddlewareStack#buildStack` is synchronous too
(`packages/trailties/src/application/default-middleware-stack.ts:42`), and an
ESM lazy load is not. Getting the loaded module to `buildStack` is the one
non-mechanical decision in `default-middleware-stack-omits-rack-cache`. Those
edits belong to the two existing stories, not to the skeleton.

Src mirrors the gem under the module root:

| Ruby                              | TS                                 |
| --------------------------------- | ---------------------------------- |
| `lib/rack/cache.rb`               | `packages/rack-cache/src/cache.ts` |
| `lib/rack/cache/context.rb`       | `src/context.ts`                   |
| `lib/rack/cache/options.rb`       | `src/options.ts`                   |
| `lib/rack/cache/cache_control.rb` | `src/cache-control.ts`             |
| `lib/rack/cache/request.rb`       | `src/request.ts`                   |
| `lib/rack/cache/response.rb`      | `src/response.ts`                  |
| `lib/rack/cache/headers.rb`       | `src/headers.ts`                   |
| `lib/rack/cache/key.rb`           | `src/key.ts`                       |
| `lib/rack/cache/meta_store.rb`    | `src/meta-store.ts`                |
| `lib/rack/cache/entity_store.rb`  | `src/entity-store.ts`              |
| `lib/rack/cache/storage.rb`       | `src/storage.ts`                   |
| `lib/rack/cache/version.rb`       | `src/version.ts`                   |

### The test suite

| Ruby test file          | cases | story                                                                                                                                                                                                        |
| ----------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cache_control_test.rb` |    27 | `port-rack-cache-cache-control-request-and-headers`                                                                                                                                                          |
| `request_test.rb`       |     3 | `port-rack-cache-cache-control-request-and-headers`                                                                                                                                                          |
| `response_test.rb`      |    37 | `port-rack-cache-response`                                                                                                                                                                                   |
| `key_test.rb`           |    11 | `port-rack-cache-key`                                                                                                                                                                                        |
| `options_test.rb`       |    10 | `port-rack-cache-options`                                                                                                                                                                                    |
| `meta_store_test.rb`    |    38 | `port-rack-cache-meta-store-base-and-heap` (34), `port-rack-cache-memcache-stores` (4 `options parsing`: 2 Dalli ported, 2 MemCached stubbed)                                                                |
| `entity_store_test.rb`  |    30 | `port-rack-cache-entity-store-base-heap-and-noop` (23), `port-rack-cache-disk-stores` (3), `port-rack-cache-memcache-stores` (4: 2 Dalli ported, 2 MemCached stubbed)                                        |
| `storage_test.rb`       |    15 | `port-rack-cache-storage` (12), `port-rack-cache-memcache-stores` (3, `MemCache Store URIs`)                                                                                                                 |
| `cache_test.rb`         |     4 | `port-rack-cache-context`                                                                                                                                                                                    |
| `context_test.rb`       |    51 | `port-rack-cache-context-test-pass-and-revalidate` (`:1-452`, 23), `port-rack-cache-context-test-fetch-and-freshness` (`:455-672`, 15), `port-rack-cache-context-test-validation-and-vary` (`:673-1033`, 13) |

The store suites are shared examples. `RackCacheMetaStoreImplementation`
(`test/meta_store_test.rb:5-355`) is `include`d into the `Heap` (`:366`), `Disk`
(`:374`), `MemCached` (`:387`) and `Dalli` (`:414`) describes, and the entity-store file does the
same. The extractor counts each shared case once, so the Disk story re-runs the
shared examples against Disk without adding new names. The `MemCached` and
`GAEStore` describes are guarded by `need_memcached` / `need_java`
(`test/test_helper.rb:62-78`) and get `PERMANENT-SKIP` stubs for the two
non-goal backends. The `Dalli` describes are guarded by `need_dalli`, and the
TS port skips them the same way when no memcached server answers at
`ENV['MEMCACHED']` (`test_helper.rb:44-60`). CI has no memcached service
(`.github/workflows/ci.yml`), and adding one is not part of this RFC.

`test/test_helper.rb` (218 lines) is the harness every context test uses:
`setup_cache_context`, `respond_with`, `cache_config`, `get`/`head`/`post`,
`create_temp_directory`. It is ported once, in `port-rack-cache-context`.

### Tooling enrollment

The same registration points RFC 0137 enumerated, each already carrying
`rack-test`:

- `scripts/api-compare/config.ts:180` `MANIFEST_PACKAGES`. `PACKAGES` derives
  from `vendor/sources.ts`, so the source entry alone enrolls it there.
- `scripts/test-compare/compare.ts:1535` `pkgDirs`,
  `scripts/test-compare/generate-stubs.ts:32`,
  `scripts/test-compare/extract-ts-tests.ts:21`.
- `scripts/test-compare/compare.ts` `rubyToConventionTs`: rack-cache's tests
  are `test/<name>_test.rb`, so the mapping is `cache_control_test.rb` →
  `cache-control.test.ts`. Check whether the default arm already produces that
  before adding a package arm.
- The skipped files `app_engine.rb` and the five deprecated alias files must
  not read as permanent 0% rows. Record them through whatever file-level skip
  `parity:api` offers, with the reason from the table above.
- `GATED_PACKAGES` in `scripts/api-compare/extra-surface-mark.json` is **not**
  widened. Gating is its own reviewed burndown (CLAUDE.md).

## Non-goals

- **`Rack::Cache::MetaStore::MemCached` / `EntityStore::MemCached`.** They
  bind the `memcached` C-extension gem, and `MEMCACHE` never selects them in a
  process without `::Memcached`. `Dalli` covers the memcache backend.
- **`GAEStore` and `app_engine.rb`.** They need JRuby on Google App Engine.
- **The Rack < 3 `HeaderHash` arm of `headers.rb:9-20`.** trails' `rack` is
  pinned at `v3.1.14`, so `require "rack/headers"` always succeeds.
- **The deprecated alias files** (`appengine.rb`, `cachecontrol.rb`,
  `entitystore.rb`, `metastore.rb`, `lib/rack-cache.rb`). They only `warn` and
  re-`require`.
- **The `rails:/` stores and the middleware mount.** They stay with
  `port-rails-meta-and-entity-stores` (RFC 0164) and
  `default-middleware-stack-omits-rack-cache` (RFC 0142), which now depend on
  this RFC.
- **A memcached service in CI.** The Dalli suites skip without a server, as the
  Ruby suite does.
- **Making `ActiveSupport::Cache::Store` async.** That is
  `cache-store-async-over-npm-clients` (RFC 0158). Nothing here waits on it.

## Alternatives considered

- **Port only `MetaStore` / `EntityStore` inside actionpack, as
  `port-rails-meta-and-entity-stores` first proposed.** This is the anti-pattern
  RFC 0133 was written to undo. The Rack-owned base classes would read as
  invented actionpack surface with no `.rb` to measure against, and
  `Rack::Cache.new`, which is what `default_middleware_stack.rb:39` mounts, would
  still not exist.
- **Put it in `packages/rack` as `src/cache/`.** `vendor/rack` has no
  `lib/rack/cache/`, so `parity:api` would compare a directory against nothing
  and `packages/rack`'s extra surface would absorb the whole gem. Rejected in
  RFC 0133 for the same reason.
- **A plain `dependencies` edge from actionpack, as rack-test has.** rack-test
  earned that edge from `actionpack.gemspec:41` and production code
  (`strong_parameters.rb:1311`). rack-cache has neither: it is Gemfile-only and
  reached only after `load_rack_cache` checks the config. A plain edge would
  make every trails app install it.
- **Port `Rack::Cache` sync and convert it later.** A memcache backend cannot
  be sync in Node, and `Context#call` is already async. There is nothing to
  gain and a conversion story to pay for (see
  `cache-store-async-over-npm-clients`).
- **Vendor from RubyGems rather than git.** The `.gem` omits `test/`
  (`rack-cache.gemspec`: `git ls-files lib/ README.md MIT-LICENSE`), which is
  the 226-case suite this RFC exists to credit. `vendor/sources.ts` also has a
  single origin shape, `type: "git"`.

## Rollout

1. **Anchor.** `vendor-rack-cache-source`.
2. **Package.** `rack-cache-package-skeleton` (deps: 1).
3. **Measure.** `enroll-rack-cache-in-compare-tooling` and
   `register-rack-cache-in-ci-lanes` (both deps: 2).
4. **Leaves** (deps: 3). `port-rack-cache-cache-control-request-and-headers`
   (then `port-rack-cache-response`), `port-rack-cache-key`, and
   `port-rack-cache-entity-store-base-heap-and-noop`.
5. **Stores.** `port-rack-cache-meta-store-base-and-heap` (deps: response,
   key, entity store), then `port-rack-cache-disk-stores`, then
   `port-rack-cache-storage`, then `port-rack-cache-memcache-stores`.
6. **Middleware.** `port-rack-cache-options` (deps: key, storage), then
   `port-rack-cache-context` (deps: options, response, meta store), then its
   three test stories, which can run in parallel:
   `port-rack-cache-context-test-pass-and-revalidate`,
   `port-rack-cache-context-test-fetch-and-freshness` and
   `port-rack-cache-context-test-validation-and-vary`.
7. **Rails consumers (other RFCs).**
   `0164-actiondispatch-http-parity/port-rails-meta-and-entity-stores` (deps:
   `port-rack-cache-storage`), then
   `0142-trailties-surfaced-deviations/default-middleware-stack-omits-rack-cache`
   (deps: `port-rack-cache-context`, `port-rails-meta-and-entity-stores`).

```text
vendor → skeleton → enroll ─┬→ cache-control/request/headers → response ─┐
                  └→ ci     ├→ key ──────────────────────────────────────┤
                            └→ entity-store base/heap/noop ──────────────┴→ meta-store base/heap
                                → disk → storage ─┬→ memcache
                                                  ├→ options → context → 3 × context tests
                                                  └→ [0164] rails meta/entity stores
                                                        → [0142] default middleware stack (also deps: context)
```

## Verification

- `pnpm parity:api` prints a `rack-cache` row. Measured against the extractor's
  158 public methods, every file in "The gem, file by file" marked **port** is
  at 100%, and every file marked **skip** is recorded as skipped, not missing.
- `pnpm parity:test` reports `rack-cache: 10 files, 226 tests`. Every case
  outside the `MemCached` / `GAEStore` describes is credited, and those carry
  `PERMANENT-SKIP` stubs.
- `grep -rn 'rack-cache-1\.17\.0/' packages/ tasks/` returns 0, so every gem
  citation resolves at `vendor/rack-cache/v1.17.0/…:LINE`.
- `pnpm parity:api --package actiondispatch` reports `http/rack_cache.rb` at 6/6
  once `port-rails-meta-and-entity-stores` lands.
- `parity:api` / `parity:test` deltas for every other package are
  non-negative at every step.

## Open questions

1. **Which npm memcached client?** The candidates are `memjs`, the one RFC 0158's
   `cache-store-async-over-npm-clients` names, and `memcached`. Recommendation:
   use whatever that story picks, so trails ships one memcached client. If
   `port-rack-cache-memcache-stores` is claimed first, it picks `memjs` and
   records the choice there. Deferred to that story.
2. **What stands in for `Marshal`?** Two sites need it.
   `MetaStore::Disk#read` / `#write` persist entries with `Marshal.load(io)` /
   `Marshal.dump(entries, io, -1)` (`meta_store.rb:246,255`). Rails'
   `RailsMetaStore#read` / `#write` round-trip through `Marshal` to deep-copy
   (`http/rack_cache.rb:23,30`), and Rails' only test for that file checks the
   copy ("stuff is deep duped", `test/dispatch/rack_cache_test.rb:16-22`).
   ruby-compat has no `Marshal`. trails' stand-in is activesupport's cache
   `coder` (`packages/activesupport/src/cache/coder.ts:104`, used by
   `cache/serializer-with-fallback.ts:34` and `:113`). **Recommendation:** both
   sites call that `coder` under the Rails call names. The Disk store takes an
   activesupport edge for it, as rack-test takes one for `Tempfile`. Its on-disk
   bytes are not Ruby's `Marshal` format, and nothing needs them to be: only
   the same store reads them back. If a ruby-compat `Marshal` lands later, both
   imports move with every other caller. Resolved in
   `port-rack-cache-disk-stores` and `port-rails-meta-and-entity-stores`.
3. **Does `rails-private-jsdoc` want `@internal` on all 40 internal methods at
   enrollment?** RFC 0133 and RFC 0137 answered yes: run the autofix in the
   enrollment PR, before any body lands. Same answer here, resolved in
   `enroll-rack-cache-in-compare-tooling`.

## Changelog

- 2026-09-28: initial RFC
