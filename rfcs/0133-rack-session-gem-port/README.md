---
rfc: "0133-rack-session-gem-port"
title: "@blazetrails/rack-session: vendor the rack-session gem and move Rack's session scaffolding out of actionpack"
status: draft
created: 2026-08-31
updated: 2026-08-31
owner: "@deanmarano"
packages:
  - rack-session
  - actionpack
  - actiondispatch
  - rack
clusters:
  - fidelity
related-rfcs:
  - "0104-twitter-app-full-stack-integration"
  - "0129-ruby-compat"
  - "0088-date-gem-port"
  - "0120-extra-surface-gating-rollout"
priority: 5
---

# RFC 0000 — `@blazetrails/rack-session`

## Summary

Rack 3 moved `Rack::Session` out of Rack into a separate `rack-session` gem.
`vendor/rack` is pinned at `v3.1.14` and correspondingly has no
`lib/rack/session/`; `packages/rack` mirrors that absence exactly, which is
correct. But Rails' actionpack still depends on the gem, so trails' actionpack
has been **hand-rolling it**: `Rack::Session::Abstract::Persisted`,
`PersistedSecure` and `Rack::Session::SessionId` live today inside
`packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts`,
and PR 7317 is adding `Persisted#call` / `#context` / `#commit_session` and
`Rack::Session::Pool` beside them, citing a gem path
(`rack-session-2.1.0/lib/rack/session/abstract/id.rb:239-497`) that resolves
against nothing in the tree.

This RFC vendors `rack-session` the way `vendor/sources.ts` already vendors six
other gems, creates `packages/rack-session`, and relocates the Rack-owned
classes there behind a re-export shim. Only the **Rack** classes move; every
`ActionDispatch::Session::` class stays in actionpack, where `parity:api`
already measures it against a real `.rb`.

## Motivation

### The evidence, as of `main` at 0ae831a91 plus PR 7317

- `vendor/rails/actionpack/actionpack.gemspec:40` — `s.add_dependency
"rack-session", ">= 1.0.1"`; `vendor/rails/Gemfile.lock:440` resolves
  `rack-session (2.1.0)`.
- `vendor/rails/actionpack/lib/action_dispatch/middleware/session/abstract_store.rb`
  opens with `require "rack/session/abstract/id"`.
- Nothing under `vendor/` provides it. `vendor/sources.ts` lists six sources
  (`rails`, `rack`, `did_you_mean`, `globalid`, `date`, `minitest`, `ruby`);
  none is `rack-session`.
- `packages/actionpack/src/action-dispatch/middleware/session/abstract-store.ts`
  says so in its own file header (`:8-14` on `main`): _"Those Rack base classes
  are not yet ported; in their place this file defines a `Persisted`
  scaffolding base with the surface the mixins call into."_ It defines
  `SessionId` (`:21`), `Persisted` (`:71`) and `PersistedSecure` (`:102`) in a
  219-line file, carrying **five** `@nie
disposition=keep-as-strategy-hook rails=rack/lib/rack/session/abstract/id.rb
cluster=actionpack-session` markers (`:81`, `:86`, `:91`, `:96`, `:104`) whose
  `rails=` path does not exist in the tree.
- `packages/actionpack/src/action-controller/metal/request-forgery-protection.ts:54`
  names `Rack::Session::Abstract::SessionHash` the same way; so do
  `session/cookie-store.ts:27`, `session/mem-cache-store.ts:7,32,56` and
  `packages/trailties/src/application/finisher.ts:28`.

### It is growing right now

`0104-twitter-app-full-stack-integration/session-and-flash-lifecycle` is
`in-progress` on **PR 7317** (683 additions / 122 deletions, draft). Its diff
adds **295 lines** to `abstract-store.ts` and creates
`middleware/session/pool.ts` (**84 lines**), both pure `rack-session` ports:
the new header reads _"Those two Rack base classes live in the `rack-session`
gem rather than in Rails, so they are ported here alongside their Rails
subclasses, from `rack-session-2.1.0/lib/rack/session/abstract/id.rb:239-497`"_,
and `pool.ts` says _"this class belongs to the `rack-session` gem rather than
to Rails"_. The PR replaces the five dangling `@nie … rails=rack/…` markers
with **three** `@nie disposition=TODO` markers on `findSession` /
`writeSession` / `deleteSession` — an anchorless ledger, since a `TODO`
disposition names no source at all. Two follow-up drafts,
`cookie-store-runnable-in-a-real-stack` and `port-setup-default-session-store`,
queue up more work on the same files.

### What it costs, measured

1. **Charged to the wrong package.** `Persisted`, `PersistedSecure`,
   `SessionId`, `DEFAULT_OPTIONS`, `ResponseRaw` and `Pool` are public names in
   `packages/actionpack/src/**`, a `parity:api`-matched tree, with no Ruby
   counterpart under `vendor/rails/actionpack/`. They read as invented
   actionpack surface permanently, and the `ResponseRaw` interface PR 7317 adds
   already carries a `@noRailsEquivalent PERMANENT` receipt for a class that
   _does_ exist upstream (`Rack::Response::Raw`) — a permanent receipt written
   only because the anchor is missing.
2. **`parity:api` cannot match them.** There is no `.rb` to extract from. Run
   against a clone of `rack-session` `v2.1.0`, this repo's own extractor
   reports:

   ```console
   $ LOCKFILE_PATH=$PWD/vendor/sources.lock.json \
     LIB_PATHS_JSON='{"rack-session":".../rs/lib/rack/session"}' \
     ruby scripts/api-compare/extract-ruby-api.rb
   Processing rack-session: 6 files...
     rack-session: 19 classes, 3 modules, 78 public methods (46 internal)
   ```

   78 public methods currently measurable against **zero**.

3. **`parity:test` cannot credit the gem's own suite** — the fidelity measure
   that would actually prove the port correct. The same tooling reads it
   unmodified:

   ```console
   $ TEST_PATHS_JSON='{"rack-session":".../rs/test"}' \
     ruby scripts/test-compare/extract-ruby-tests.rb
   Processing rack-session: 7 test files...
     rack-session: 7 files, 124 tests
   Total: 124 tests across 7 files (0 adapter/feature-gated)
   ```

   124 test names, 0 creditable today. The specs are minitest-spec
   `describe`/`it`, which `extract-ruby-tests.rb` already handles (its header
   lists Minitest::Spec first), and their `spec_*.rb` filenames are exactly the
   shape `rubyToConventionTs`'s existing `pkg === "rack"` branch
   (`scripts/test-compare/compare.ts:127-133`) strips.

4. **The `@nie` ledger has nothing to burn down against.** `@nie` is a
   burndown annotation (`eslint/nie-requires-annotation.mjs`); a marker whose
   `rails=` path does not exist, or which degrades to `disposition=TODO`, is a
   ledger row with no anchor. Same for the story citations: no reviewer can
   open `rack-session-2.1.0/lib/rack/session/abstract/id.rb:239-497`.

### Why this is cheap

The pattern is already established six times over. `vendor/sources.ts:133-200`
vendors `rack`, `did_you_mean` and `globalid` as a source entry plus a
`packages/<name>/` workspace dir, each with `libPath` pointing at the **module
root** (`lib/rack`, `lib/global_id`) rather than bare `lib`, so the extractor
does not also scan the entrypoint shim. `rack-session` is the same shape:
`libPath: "lib/rack/session"`, `testPath: "test"`.

And unlike `ruby-compat`, this has **no C-surface problem and no
leaf-dependency problem**. `rack-session` is ordinary Ruby — the extractor
numbers above are the proof — and its only runtime dependency is `rack`, which
trails already ships as `packages/rack`. So it gets the **full contract**:
a vendored read-anchor, `parity:api` extraction (`compareApi` left on, unlike
`date` and `minitest`), and the gem's own tests through `parity:test`
(`compareTests` on). It needs none of the weaker citation-lint contract RFC
0129 had to invent for `ruby-compat`, and no `@noRailsEquivalent PERMANENT`
receipts at all for members the gem defines.

## Design

### The vendor entry

A new source in `vendor/sources.ts`, mirroring the `rack` entry:

```ts
{
  name: "rack-session",
  origin: {
    type: "git",
    url: "https://github.com/rack/rack-session.git",
    ref: "v2.1.0",
  },
  packages: [
    {
      // TS-side workspace dir is `packages/rack-session/src`; api-compare
      // derives it from the package name, so the kebab form is the name.
      name: "rack-session",
      // As with `rack`, point at the module root rather than bare `lib`,
      // which would also scan lib/rack/session.rb (the entrypoint shim).
      libPath: "lib/rack/session",
      testPath: "test",
    },
  ],
}
```

`v2.1.0` is the version `vendor/rails/Gemfile.lock:440` resolves, and it is
inside actionpack's declared range (`>= 1.0.1`) and railties'
(`>= 2.0.0, < 3`, `Gemfile.lock:569`). Moving that ref moves the `:LINE`
citations the port writes, so it moves only when the Rails pin moves — the same
rule `vendor/sources.ts` states for `minitest`.

Verified line anchors at that ref (`lib/rack/session/`):

| Ruby                                                | file:line                    | lines     |
| --------------------------------------------------- | ---------------------------- | --------- |
| `SessionId`                                         | `abstract/id.rb:21`          | 21-44     |
| `Abstract::SessionHash`                             | `abstract/id.rb:50`          | 50-236    |
| `Abstract::Persisted`                               | `abstract/id.rb:239`         | 239-458   |
| `Abstract::PersistedSecure` (+ `SecureSessionHash`) | `abstract/id.rb:460`         | 460-497   |
| `Abstract::ID`                                      | `abstract/id.rb:499`         | 499-535   |
| `Pool`                                              | `pool.rb:26`                 | 26-76     |
| `Cookie`                                            | `cookie.rb:91`               | 91-313    |
| `Encryptor`                                         | `encryptor.rb`               | 192 lines |
| `Constants` / `VERSION`                             | `constants.rb`, `version.rb` | 13 / 10   |

### What moves and what does not

Every class was checked against
`vendor/rails/actionpack/lib/action_dispatch/middleware/session/`, which
contains exactly four `.rb` files: `abstract_store.rb`, `cache_store.rb`,
`cookie_store.rb`, `mem_cache_store.rb`.

**Moves to `packages/rack-session/src/`** — Rack-owned, no Rails `.rb`:

| TS today                                            | Ruby anchor                      |
| --------------------------------------------------- | -------------------------------- |
| `SessionId` (`abstract-store.ts:21`)                | `abstract/id.rb:21`              |
| `Persisted` (`abstract-store.ts:71`)                | `abstract/id.rb:239`             |
| `PersistedSecure` (`abstract-store.ts:102`)         | `abstract/id.rb:460`             |
| `DEFAULT_OPTIONS`, `ResponseRaw` (added by PR 7317) | `abstract/id.rb:240-253`, `:275` |
| `Pool` (`session/pool.ts`, added by PR 7317)        | `pool.rb:26`                     |

**Stays in actionpack** — each has a real Rails counterpart already measured by
`parity:api`:

| TS                                                                                                                   | Rails `.rb`                  |
| -------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `AbstractStore`, `AbstractSecureStore`, `Compatibility`, `StaleSessionCheck`, `SessionObject`, `SessionRestoreError` | `abstract_store.rb:12-104`   |
| `CookieStore` (incl. its `SessionId < DelegateClass(Rack::Session::SessionId)`)                                      | `cookie_store.rb:52-53`      |
| `CacheStore`                                                                                                         | `cache_store.rb`             |
| `MemCacheStore`                                                                                                      | `mem_cache_store.rb`         |
| `resolve-store.ts`                                                                                                   | `action_dispatch.rb:113-124` |
| `ActionDispatch::Request::Session` (`request/session.ts`)                                                            | `request/session.rb`         |

Moving any of those into the gem package would destroy working coverage — the
inverse of the problem being solved.

### Package shape

`packages/rack-session/` is modelled on `packages/rack/`: `package.json`
(`@blazetrails/rack-session`, one workspace dependency on `@blazetrails/rack`),
`tsconfig.json`, `src/index.ts`, and the four cross-package registrations
(`pnpm-workspace.yaml`, root `tsconfig.json` references, the `vitest.config.ts`
alias **plus** its trailing-slash subpath entry above the bare one, and both
`vitest.dx-tests.config.ts` tsconfigs). `packages/actionpack` gains a
dependency on it, mirroring the gemspec.

Src layout mirrors the gem under the module root, so
`lib/rack/session/abstract/id.rb` → `packages/rack-session/src/abstract/id.ts`,
`pool.rb` → `src/pool.ts`.

### Tooling enrollment

- `scripts/api-compare/config.ts`: add `rack-session` to `PACKAGES` and to
  `MANIFEST_PACKAGES` (it qualifies by that list's own stated rule — a package
  is projectable exactly when the Ruby extractor runs over its vendored source,
  which `compareApi !== false` already means).
- `scripts/test-compare/compare.ts`: add `"rack-session":
"packages/rack-session/src/"` to `pkgDirs` (`:1472`) and extend the
  `pkg === "rack"` `spec_` branch in `rubyToConventionTs` (`:127`) to cover it.
- `scripts/api-compare/extra-surface-mark.json`: the package is **not** added
  to `GATED_PACKAGES`. Widening that set is a separate decision with its own
  burndown (CLAUDE.md); `rack-session` is measured and reported like the other
  gem ports.

### The re-export shim

Each relocation lands a shim at the old actionpack path re-exporting from
`@blazetrails/rack-session`, so the move is reviewable and independently
revertible and no importer changes in the same PR. A final story deletes the
shims and rewrites the importers — the shape RFC 0129 established
(`move-tempfile-to-ruby-compat` → `delete-ruby-compat-reexport-shims`).

## Non-goals

- **`Rack::Session::Cookie` and `Rack::Session::Encryptor`
  (`cookie.rb`, 313 lines; `encryptor.rb`, 192).** Rails' `CookieStore`
  subclasses `AbstractSecureStore`, not `Rack::Session::Cookie`, so trails
  calls neither; they get `PERMANENT-SKIP` test stubs and are ported only if a
  call site appears.
- **`Rack::Session::Abstract::ID` (`abstract/id.rb:499`).** A deprecated
  compatibility shim over `Persisted`; nothing in Rails or trails calls it.
- **Gating `rack-session` in `parity:api:extra:gate`.** Enrolling a package in
  `GATED_PACKAGES` is its own reviewed burndown, not a side effect of creating
  the package.
- **Blocking or reverting PR 7317.** Blocking an in-flight PR is expensive; the
  relocation story moves whatever it lands. See Open questions.
- **Rewriting `ActionDispatch::Request::Session` to be `Rack::Session::Abstract::SessionHash`.**
  Rails' `session_class` returns its own `Request::Session`; the two are
  different classes and both stay where their `.rb` is.

## Alternatives considered

- **Leave it in actionpack, tag the classes `@noRailsEquivalent PERMANENT`.**
  Cheapest today, and it is what PR 7317's `ResponseRaw` receipt already does.
  It permanently misprices ~78 measurable public methods as invented actionpack
  surface and forfeits 124 creditable test names. Rejected: a receipt is a
  ledger row, not a fix (CLAUDE.md, "A documented deviation is debt").
- **Put it in `packages/rack` as `src/session/`.** One fewer package. But
  `vendor/rack` is pinned at `v3.1.14`, which deliberately does **not** contain
  `lib/rack/session/`, so `parity:api` would compare a directory against
  nothing and `packages/rack`'s extra-surface figure would absorb the whole
  gem. Rejected: it reproduces the exact miscounting in a different package.
- **Vendor the gem as a read-anchor only (`compareApi: false`, like `date` /
  `minitest`).** Fixes the dangling citations and nothing else. Rejected: the
  two extractor runs above show both halves work unmodified, so the weaker
  contract buys nothing.
- **Vendor from RubyGems rather than git.** `vendor/sources.ts` has one origin
  shape (`type: "git"`) and every existing entry uses it. Rejected for
  consistency; the git tag `v2.1.0` is the released gem.

## Rollout

1. **Anchor.** `vendor-rack-session-source` — the `vendor/sources.ts` entry and
   lockfile row. Independent of PR 7317.
2. **Package.** `rack-session-package-skeleton` (deps:
   `vendor-rack-session-source`) — empty workspace package plus README
   contract.
3. **Tooling.** `enroll-rack-session-in-compare-tooling` (deps:
   `rack-session-package-skeleton`) — `parity:api` and `parity:test` see the
   package; both report 100% missing, which is the honest baseline.
4. **Relocate.** `relocate-rack-session-scaffolding-out-of-actionpack` (deps:
   `enroll-rack-session-in-compare-tooling`) — lands **after PR 7317 merges**
   and moves whatever is there.
5. **Port against the readable source.** `port-rack-session-session-hash` and
   `port-rack-session-abstract-persisted-bodies` (both dep on step 4).
6. **Measure.** `enroll-rack-session-test-suite` (deps: step 5) — the 124 tests
   and the `PERMANENT-SKIP` stubs for the non-goal files.
7. **Clean up.** `delete-rack-session-reexport-shims` (deps: step 6) — shims
   and `@nie` markers gone.

## Verification

- `packages/actionpack/src/action-dispatch/middleware/session/**` contains
  **zero** `@nie` markers: five on `main` today, three after PR 7317, zero
  after `delete-rack-session-reexport-shims`.
- `grep -rn 'rack-session-2\.1\.0/\|rails=rack/lib/rack/session' packages/`
  returns **0** — every gem citation resolves at `vendor/rack-session/…:LINE`.
- `pnpm parity:api` reports a `rack-session` row against the extractor's 78
  public methods (from 0 measured today), and actionpack's `parity:api:extra`
  novel count drops by the moved names — 3 exported classes on `main`, 6
  exported names after PR 7317 (`SessionId`, `Persisted`, `PersistedSecure`,
  `DEFAULT_OPTIONS`, `ResponseRaw`, `Pool`).
- `pnpm parity:test` reports `rack-session: 7 files, 124 tests` on the Ruby
  side, with a non-negative delta at every step.
- `pnpm parity:api` / `parity:test` deltas for `actionpack` are non-negative
  throughout: nothing with a Rails `.rb` moves.

## Open questions

1. **Sequencing against in-flight PR 7317.** _(Recommendation, not blocking.)_
   `session-and-flash-lifecycle` is `in-progress` on PR 7317 and adds 295 lines
   to `abstract-store.ts` plus an 84-line `pool.ts`. Do **not** block it. Steps
   1–3 (`vendor-rack-session-source`, `rack-session-package-skeleton`,
   `enroll-rack-session-in-compare-tooling`) touch no file PR 7317 touches and
   can land in parallel. Step 4 waits for 7317 to merge and moves what it
   landed. The two 0104 drafts —
   `0104-twitter-app-full-stack-integration/cookie-store-runnable-in-a-real-stack`
   and `.../port-setup-default-session-store` — are `draft` and unclaimed:
   **recommendation** is to let them land against actionpack as written (their
   work is `RequestCookieMethods` and `setup_default_session_store`, neither of
   which is Rack-owned) and have step 4 move only the Rack classes underneath
   them. If either is claimed _after_ step 4 merges, it targets the new package
   directly. `cookie-store-runnable-in-a-real-stack` also needs its Context
   citation rewritten to `vendor/rack-session/lib/rack/session/abstract/id.rb:239-497`
   once step 1 lands; that edit is folded into step 1's acceptance.
2. **Does `MANIFEST_PACKAGES` enrollment red the privates lint?**
   `scripts/build-rails-privates-manifest.ts` projects Ruby visibility onto TS,
   and the extractor already reports 46 of `rack-session`'s 78 methods as
   internal. Adding the package makes `blazetrails/rails-private-jsdoc`
   (autofixable) demand `@internal` on ~46 members at once. Recommendation:
   land the enrollment and the autofix in step 3, before any body is ported, so
   the fix is mechanical. Deferred to that story if it proves noisier.
3. **Where does `Rack::Session::Abstract::SessionHash` land, given trails uses
   `ActionDispatch::Request::Session` in its place?** `Persisted#session_class`
   returns `SessionHash`; Rails overrides it to return `Request::Session`, and
   trails' PR 7317 hard-codes the Rails answer. Recommendation: port
   `SessionHash` into `rack-session` for real (it is 186 lines and 25 of the
   124 tests cover it directly — `spec_session_abstract_session_hash.rb` 14 +
   `spec_session_abstract_persisted_secure_secure_session_hash.rb` 11), and let
   the actionpack override keep returning `Request::Session`. That is
   `port-rack-session-session-hash`.
4. **Is `Rack::Session::Cookie` really unused?** Checked against Rails'
   `cookie_store.rb:52` (`class CookieStore < AbstractSecureStore`) — it is.
   Flagged here because a future `Rack::Session::Cookie`-shaped requirement
   would reopen the Non-goal, not because it is unresolved.

## Changelog

- 2026-08-31: initial RFC
