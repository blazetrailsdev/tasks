---
rfc: "0000-rack-test-gem-port"
title: "@blazetrails/rack-test: vendor the rack-test gem and collapse actionpack's hand-rolled stand-ins onto it"
status: draft
created: 2026-09-03
updated: 2026-09-03
owner: "@deanmarano"
packages:
  - rack-test
  - actionpack
  - actiondispatch
  - actioncontroller
clusters:
  - fidelity
related-rfcs:
  - "0133-rack-session-gem-port"
  - "0104-twitter-app-full-stack-integration"
  - "0106-wide-call-set-direct-burndown"
  - "0088-date-gem-port"
priority: 5
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — `@blazetrails/rack-test`

## Summary

`rack-test` is a declared **runtime** dependency of actionpack
(`vendor/rails/actionpack/actionpack.gemspec:41`, `s.add_dependency
"rack-test", ">= 0.6.3"`; `vendor/rails/Gemfile.lock:443` resolves
`rack-test (2.2.0)`). Rails' integration harness, its controller test-case
encoder, its fixture-file upload helper and — in production code —
`ActionController::Parameters`' permitted-scalar list all name `Rack::Test::`
constants directly.

Nothing under `vendor/` provides it. `vendor/sources.ts` vendors eight sources
(`rails`, `rack`, `rack-session`, `did_you_mean`, `globalid`, `date`,
`minitest`); none is rack-test. So trails has been **hand-rolling stand-ins
inside actionpack**: a private `MockSession` class in `integration.ts` whose
own header says "Rack::Test lives outside Rails so there is no file to port",
a `buildMultipartBody` function in `test-case.ts` tagged "Mirrors Rails
`Rack::Test::Utils.build_multipart`" that invents its own boundary string, and
a `fileFixtureUpload` that returns `ActionDispatch::Http::UploadedFile` where
Rails returns `Rack::Test::UploadedFile`.

This RFC vendors `rack-test` at `v2.2.0` the way `vendor/sources.ts` already
vendors eight other sources, creates `packages/rack-test`, ports the gem against
its own 234-case suite, and collapses the actionpack stand-ins onto it. It is
the same shape as RFC 0133 (`rack-session-gem-port`), which is 43/45 done, and
it uses the same tooling with no extractor changes at all.

## Motivation

### The evidence, as of `main` at 2b322a1b1

- **It is a real dependency, not a dev convenience.**
  `vendor/rails/actionpack/actionpack.gemspec:41` declares it with
  `add_dependency`, beside `rack` and `rack-session` — not
  `add_development_dependency`. `vendor/rails/Gemfile.lock:443` resolves
  `rack-test (2.2.0)`, and `:30` / `:166` show actionpack and railties both
  depending on it.
- **Rails' library code names it in five files**, and one of them is not test
  code at all:

  | Rails file:line | names |
  | --- | --- |
  | `actionpack/lib/action_dispatch.rb:36` | `autoload :Test, "rack/test"` |
  | `actionpack/lib/action_controller/test_case.rb:152,163,174` | `Rack::Test::Utils`, `Rack::Test::UploadedFile`, `Rack::Test::MULTIPART_BOUNDARY` |
  | `actionpack/lib/action_dispatch/testing/integration.rb:7,283` | `require "rack/test"`, `Rack::Test::Session.new(_mock_session)` |
  | `actionpack/lib/action_dispatch/testing/test_process.rb:12,27` | `Rack::Test::UploadedFile.new(path, mime_type, binary)` |
  | `actionpack/lib/action_controller/metal/strong_parameters.rb:11,550,1311` | `Rack::Test::UploadedFile` in `PERMITTED_SCALAR_TYPES` |

  `strong_parameters.rb` is production code: an app's `params.permit` behaves
  differently depending on whether `Rack::Test::UploadedFile` is a permitted
  scalar. That single call site is why this package cannot be
  devDependency-only (see "Published, not devDependency-only", below).

- **The whole-tree census is concentrated and small.** 55 `.rb` files under
  `vendor/rails/` mention `Rack::Test`, and what they name is:

  ```
  45  Rack::Test::Methods
  17  Rack::Test::UploadedFile
   1  Rack::Test::Utils
   1  Rack::Test::Session
   1  Rack::Test::MULTIPART
  ```

  The 45 are `include Rack::Test::Methods` in Rails' own test files — one
  module, 5 public methods. `Methods` and `UploadedFile` are effectively the
  whole surface Rails touches.

### What trails does instead, measured

| trails | what it is | Rails' answer |
| --- | --- | --- |
| `packages/actionpack/src/action-dispatch/testing/integration.ts:1073-1088` — `class MockSession` | a 26-line private class. Its header: _"Rack::Test lives outside Rails so there is no file to port"_ | `Rack::Test::Session` (`lib/rack/test.rb:53-373`, 320 lines) |
| `integration.ts:1073` — `MockSession#cookieJar` is an `ActionDispatch::Cookies::CookieJar` | a genuine Rails class pressed into service as a stand-in | `Rack::Test::CookieJar` (`lib/rack/test/cookie_jar.rb:134-250`) |
| `packages/actionpack/src/action-controller/test-case.ts:671-696` — `buildMultipartBody` | _"@internal Mirrors Rails Rack::Test::Utils.build_multipart"_. Hard-codes `const boundary = "AaB03x"` | `ENCODER` does `include Rack::Test::Utils` and `public :build_multipart` (`test_case.rb:152,171`); the boundary is `Rack::Test::MULTIPART_BOUNDARY` = `'----------XnJLe9ZIbbGUYtzPQJ16u1'` (`lib/rack/test.rb:36`) |
| `test-case.ts:698-708` — `shouldMultipart` | reimplements the recursion over `UploadedFile` | `ENCODER#should_multipart?` (`test_case.rb:155-169`), whose own Rails comment reads _"FIXME: lifted from Rack-Test"_ |
| `packages/actionpack/src/action-dispatch/testing/test-process.ts:63-97` — `fileFixtureUpload` | returns `ActionDispatch::Http::UploadedFile`, with a `NOTE:` conceding the divergence | `Rack::Test::UploadedFile.new(path, mime_type, binary)` (`test_process.rb:27`) |

The boundary string is the clearest single symptom: a trails controller test
posts `--AaB03x` where every Rails controller test posts
`------------XnJLe9ZIbbGUYtzPQJ16u1`, because there is no
`Rack::Test::MULTIPART_BOUNDARY` in the tree to name.

### What it costs, measured

1. **90 public methods measurable against zero.** Run against a clone of
   `rack-test` `v2.2.0`, this repo's own extractor, unmodified:

   ```console
   $ API_COMPARE_FORCE=1 LOCKFILE_PATH=$PWD/vendor/sources.lock.json \
     LIB_PATHS_JSON='{"rack-test":".../rt/lib/rack/test"}' \
     LIB_ENTRY_FILES_JSON='{"rack-test":".../rt/lib/rack/test.rb"}' \
     ruby scripts/api-compare/extract-ruby-api.rb
   Processing rack-test: 5 files...
     rack-test: 5 classes, 4 modules, 90 public methods (17 internal)
   ```

2. **234 test cases creditable against zero.** Same tooling, unmodified:

   ```console
   $ TEST_PATHS_JSON='{"rack-test":".../rt/spec"}' \
     ruby scripts/test-compare/extract-ruby-tests.rb
   Processing rack-test: 9 test files...
     rack-test: 8 files, 234 tests
   Total: 234 tests across 8 files (0 adapter/feature-gated)
   ```

   Per file: `test_spec.rb` 115, `cookie_spec.rb` 33, `utils_spec.rb` 26,
   `multipart_spec.rb` 24, `cookie_jar_spec.rb` 10, `uploaded_file_spec.rb` 10,
   `cookie_object_spec.rb` 9, `methods_spec.rb` 7.

   The specs are **minitest-spec**, not RSpec — `spec/spec_helper.rb:13` is
   `require 'minitest/global_expectations/autorun'` and the gemspec's only test
   dev-deps are `minitest` and `minitest-global_expectations`. That is the
   style `extract-ruby-tests.rb` already handles (its header lists
   Minitest::Spec first), which is why the run above needed no change.

3. **Charged to the wrong package.** `MockSession`, `buildMultipartBody` and
   `shouldMultipart` are names in `packages/actionpack/src/**` — a
   `parity:api`-matched tree — with no counterpart under
   `vendor/rails/actionpack/`. `parity:api` cannot match them, because there is
   no `.rb` to extract from, so they read as invented actionpack surface
   permanently.

4. **A ready story is stuck behind it.**
   `0104-twitter-app-full-stack-integration/converge-integration-session-to-rack-test-session`
   is `ready` at 500 loc and asks `Integration::Session#process` to drive the
   app "through `Rack::Test::Session`". There is no `Rack::Test::Session` in
   the tree for it to drive through. Two reviewers on PR #7317 flagged the
   hand-rolled dispatch loop as a structural deviation; that story is the fix
   and this RFC is its missing prerequisite.

### Why this is cheap

The pattern is established eight times over, and rack-test is the easiest
instance yet:

- **987 lines of ordinary Ruby in 6 files** — `test.rb` 382, `cookie_jar.rb`
  251, `utils.rb` 156, `uploaded_file.rb` 99, `methods.rb` 94, `version.rb` 5.
  No C surface (unlike `date`), so `compareApi` stays on.
- **A TS package dir to map onto** (unlike `minitest`), so `compareTests`
  stays on too.
- **One runtime dependency**, `rack '>= 1.3'` (`rack-test.gemspec:28`), which
  trails already ships as `packages/rack`. No leaf-dependency problem.
- **Both extractors already work**, per the two runs above. Nothing in
  `scripts/api-compare/` or `scripts/test-compare/` needs teaching a new idiom;
  enrollment is registrations, not code.

So rack-test gets the **full contract**: a vendored read-anchor, `parity:api`
extraction, and the gem's own 234 tests through `parity:test`.

## Design

### Published, not devDependency-only

**Decision: `packages/rack-test` ships as a normal published workspace package,
exactly like `packages/rack` and `packages/rack-session`. It is not
`private: true`, it is not a devDependency, and its suite runs in the default
`pnpm test` path.**

The instinct to make a testing library dev-only is wrong here, for three
reasons, in descending order of force:

1. **Rails ships it at runtime.** `actionpack.gemspec:41` is `add_dependency`,
   not `add_development_dependency`. Mirroring the gemspec is the rule
   (CLAUDE.md, "Fidelity is the job"), and `packages/actionpack` gaining a
   plain `dependencies` entry on `@blazetrails/rack-test` **is** that mirror.
2. **Production code names it.** `strong_parameters.rb:1311` lists
   `Rack::Test::UploadedFile` in `PERMITTED_SCALAR_TYPES`, reached by every
   `params.permit` call in a running app, not only under test. A dev-only
   package cannot be imported from `packages/actionpack/src/action-controller/
   metal/strong-parameters.ts` in a published build.
3. **trails users need it.** `Rack::Test::Methods` is the public integration
   surface a trails app's own tests will `include`. Publishing it as
   `@blazetrails/rack-test` is what makes that possible; hiding it in
   devDependencies would make the 45-file `include Rack::Test::Methods`
   population unportable for downstream apps.

Consequences, stated so no story re-derives them:

- **`packages/rack-test/package.json`** is modelled on
  `packages/rack-session/package.json` — `"name": "@blazetrails/rack-test"`,
  `"version": "0.1.0"`, `"type": "module"`, `main`/`types` at `dist/`,
  `"files": ["dist"]`, `"license": "MIT"`. **No `"private": true`** —
  `packages/website` is the only private package in the repo. Its workspace
  dependencies are the same three `packages/rack-session` and `packages/rack`
  both declare, and they are not interchangeable — see "Dependencies: rack,
  ruby-compat and (for now) activesupport" below.
- **CI lane registration follows `rack-session` exactly.** RFC 0133's
  `register-rack-session-in-ci-lanes` put the package into
  `RACK_PKGS_RE='^packages/(rack|rack-session|activesupport|date)/'`
  (`.github/workflows/ci.yml:118`), the Rack tests step
  (`ci.yml:733`, `pnpm vitest run packages/rack packages/rack-session`) and
  the non-AR coverage list (`ci.yml:814`). rack-test joins all three, plus
  `AP_PKGS_RE` (`ci.yml:112`) — because collapsing the actionpack stand-ins
  makes actionpack's suite depend on it, which `rack-session` never did.
- **The suite runs by default.** Its tests are `packages/rack-test/src/*.test.ts`
  like every other package's, collected by the root `vitest.config.ts`. There
  is no "test-only package so skip its tests" carve-out, and inventing one
  would be the exact inversion of the point: the 234 gem tests are the fidelity
  measure this RFC exists to buy.

### The vendor entry

A new source in `vendor/sources.ts`:

```ts
{
  name: "rack-test",
  origin: {
    type: "git",
    url: "https://github.com/rack/rack-test.git",
    // vendor/rails/Gemfile.lock:443 resolves rack-test (2.2.0), inside
    // actionpack's declared range (`>= 0.6.3`,
    // vendor/rails/actionpack/actionpack.gemspec:41).
    ref: "v2.2.0",
  },
  packages: [
    {
      name: "rack-test",
      // The Rack::Test module root, for the same reason `rack` points at
      // `lib/rack` and `rack-session` at `lib/rack/session`.
      libPath: "lib/rack/test",
      // Unlike those two, the entrypoint here is NOT a bare shim:
      // lib/rack/test.rb defines Session (:53), Error (:45), DEFAULT_HOST
      // (:33) and MULTIPART_BOUNDARY (:36) — 382 lines of real surface.
      libEntryFile: "lib/rack/test.rb",
      testPath: "spec",
    },
  ],
}
```

**This is the one place rack-test's layout differs from its two siblings, and
it is the layout decision worth stating.** `rack` and `rack-session` both point
`libPath` at the module root explicitly to *exclude* the entrypoint shim beside
it. rack-test's entrypoint is not a shim — it is the largest file in the gem.
So the module-root `libPath` is kept for the same path-mapping reason, and the
entry file is recovered through `libEntryFile`, the mechanism `arel` already
uses for `activerecord/lib/arel.rb` (`vendor/sources.ts:83`). Verified: both
spellings extract identically (`libPath: "lib/rack"` over 6 files, and
`libPath: "lib/rack/test"` + `libEntryFile` over 5 + entry, each reporting
`5 classes, 4 modules, 90 public methods (17 internal)`), but only the second
maps `cookie_jar.rb` onto `packages/rack-test/src/cookie-jar.ts` rather than
onto `src/test/cookie-jar.ts`.

`testPath` is `spec`, not `test` — rack-test's suite lives in `spec/`.

### Dependencies: rack, ruby-compat and (for now) activesupport

`rack-test.gemspec:28` declares one runtime dependency, `rack '>= 1.3'`. But a
gemspec does not declare the **stdlib**, and rack-test requires six stdlib
files across its 987 lines:

| Ruby | rack-test file:line | trails home |
| --- | --- | --- |
| `tempfile` | `uploaded_file.rb:4` (`Tempfile.new` at `:92`) | `@blazetrails/activesupport` — `packages/activesupport/src/tempfile.ts` |
| `stringio` | `uploaded_file.rb:5` (`when StringIO` at `:36`) | `@blazetrails/ruby-compat` — `src/string-io.ts:20` |
| `fileutils` | `uploaded_file.rb:3` | `@blazetrails/ruby-compat` — `index.ts:41`, `FileUtils` |
| `uri` | `test.rb:3`, `cookie_jar.rb:3`; `Session#parse_uri` at `test.rb:271` | `@blazetrails/ruby-compat` (`getFs` / `getPath` seat) |
| `time` | `cookie_jar.rb:4` (`Cookie#expires`, `:81`) | `@blazetrails/activesupport` / `@blazetrails/ruby-compat` |
| `forwardable` | `test.rb:21`, `methods.rb:3` | no port needed — TS delegation |

So `packages/rack-test/package.json` declares **exactly the three workspace
dependencies `packages/rack-session/package.json` already declares** —
`@blazetrails/rack`, `@blazetrails/ruby-compat`, `@blazetrails/activesupport` —
and `packages/rack/package.json` declares two of the three for the same reason
(`packages/rack/src/mock-request.ts:21` imports `StringIO`;
`packages/rack/src/multipart/parser.ts:1` imports `forceEncoding` from
ruby-compat).

**The `activesupport` edge is inherited debt, not a design choice.**
`Tempfile` is Ruby stdlib and belongs in `ruby-compat`;
`0129-ruby-compat/move-tempfile-to-ruby-compat` is the story that moves it and
it is **`blocked`**, on "Tempfile imports getFs/getPath (fs-adapter, 483 LOC),
getOs (158) and getCrypto (393) from activesupport … the move needs a home for
the fs/os/crypto seat decided first". rack-test does **not** wait on that:
`Rack::Test::UploadedFile` wraps a `Tempfile` (`uploaded_file.rb:9`, `:92`), so
it imports the one that exists today, from wherever it lives, exactly as
`packages/rack` does. When `move-tempfile-to-ruby-compat` unblocks and lands,
rack-test's import moves with every other caller and its `activesupport` edge
drops out — one line in that story's sweep, not a story of its own here.

Verified line anchors at `v2.2.0`:

| Ruby | file:line | lines |
| --- | --- | --- |
| `DEFAULT_HOST` / `MULTIPART_BOUNDARY` | `test.rb:33`, `:36` | — |
| `Error` | `test.rb:45` | 45 |
| `Session` | `test.rb:53` | 53-373 |
| `Rack::Test.encoding_aware_strings?` | `test.rb:375` | 375-377 |
| `Cookie` | `cookie_jar.rb:10` | 10-132 |
| `CookieJar` | `cookie_jar.rb:134` | 134-250 |
| `Utils` | `utils.rb:5` | 5-155 |
| `UploadedFile` | `uploaded_file.rb:14` | 14-98 |
| `Methods` | `methods.rb:24` | 24-93 |
| `VERSION` | `version.rb:3` | 5 |

### Package shape

`packages/rack-test/` is modelled on `packages/rack-session/`: `package.json`,
`tsconfig.json`, `src/index.ts`, and the four cross-package registrations —
`pnpm-workspace.yaml` (covered by the `packages/*` glob), root `tsconfig.json`
references (`tsconfig.json:30` is the rack-session row), and **both**
`vitest.config.ts` alias entries, the trailing-slash subpath one placed *above*
the bare one (`vitest.config.ts:249-250`).

Src mirrors the gem under the module root:

| Ruby | TS |
| --- | --- |
| `lib/rack/test.rb` | `packages/rack-test/src/test.ts` |
| `lib/rack/test/cookie_jar.rb` | `src/cookie-jar.ts` |
| `lib/rack/test/methods.rb` | `src/methods.ts` |
| `lib/rack/test/uploaded_file.rb` | `src/uploaded-file.ts` |
| `lib/rack/test/utils.rb` | `src/utils.ts` |
| `lib/rack/test/version.rb` | `src/version.ts` |

### Tooling enrollment

Every registration point, enumerated from where `rack-session` appears today:

- `scripts/api-compare/config.ts:190` — `MANIFEST_PACKAGES` gains `"rack-test"`.
  (`PACKAGES` is derived from `vendor/sources.ts` by `apiComparePackages()`, so
  the source entry alone enrolls it there.)
- `scripts/test-compare/compare.ts:1493` — `pkgDirs` gains
  `"rack-test": "packages/rack-test/src/"`.
- `scripts/test-compare/compare.ts:128-140` — `rubyToConventionTs` gains a
  `rack-test` arm. The Ruby side reports paths relative to `spec/`, so they
  carry a leading `rack/` (`rack/test_spec.rb`, `rack/test/utils_spec.rb`);
  strip `rack/`, then strip the redundant `test/` segment — the same
  repeated-lib-root case as the i18n and rack-session arms — and map
  `_spec.rb` → `.test.ts`. So `rack/test_spec.rb` → `test.test.ts` and
  `rack/test/cookie_jar_spec.rb` → `cookie-jar.test.ts`. Its cases go in
  `scripts/test-compare/compare.test.ts` beside the rack-session ones
  (`:157-159`).
- `scripts/test-compare/generate-stubs.ts:31` and
  `scripts/test-compare/extract-ts-tests.ts:20` — the same package list, both
  of which `rack-session` had to be added to (RFC 0133 filed
  `add-rack-session-to-generate-stubs-pkg-dirs` for exactly the half that was
  missed; do both at once here).
- `scripts/api-compare/extra-surface-mark.json` — the package is **not** added
  to `GATED_PACKAGES`. Widening that set is a separate reviewed burndown
  (CLAUDE.md), not a side effect of creating a package.

Three of the eight spec files have no same-named lib file —
`cookie_spec.rb` and `cookie_object_spec.rb` both cover `cookie_jar.rb`, and
`multipart_spec.rb` covers `utils.rb`. Their TS counterparts (`cookie.test.ts`,
`cookie-object.test.ts`, `multipart.test.ts`) are test files with no sibling
source, which `packages/rack` already does.

### Collapsing the actionpack stand-ins

Each is a separate story, and each lands **after** the member it collapses onto
is ported, so no story is a rewrite plus a port in one PR:

| actionpack today | collapses onto | story |
| --- | --- | --- |
| `test-case.ts:671-708` `buildMultipartBody` / `shouldMultipart`, boundary `"AaB03x"` | `Rack::Test::Utils#build_multipart` + `MULTIPART_BOUNDARY` | `collapse-actionpack-multipart-encoder-onto-rack-test-utils` |
| `test-process.ts:63-97` `fileFixtureUpload` returning `ActionDispatch::Http::UploadedFile` | `Rack::Test::UploadedFile` | `converge-file-fixture-upload-onto-rack-test-uploaded-file` |
| `integration.ts:1073-1088` `class MockSession` | `Rack::Test::Session` + `Rack::Test::CookieJar` | **not this RFC** — see Non-goals |

**Stays in actionpack**, because each has a real Rails `.rb` already measured by
`parity:api`, and moving it would destroy working coverage:

| TS | Rails `.rb` |
| --- | --- |
| `action-dispatch/http/upload.ts` (`ActionDispatch::Http::UploadedFile`) | `action_dispatch/http/upload.rb` |
| `action-dispatch/dispatch/uploaded-file.test.ts` | `actionpack/test/dispatch/uploaded_file_test.rb` |
| `action-dispatch/testing/test-process.ts` (`TestProcess`) | `action_dispatch/testing/test_process.rb` |
| `action-dispatch/testing/integration.ts` (`Integration::Session`, `Runner`) | `action_dispatch/testing/integration.rb` |
| `action-controller/test-case.ts` (`ActionController::TestCase`) | `action_controller/test_case.rb` |

`ActionDispatch::Http::UploadedFile` and `Rack::Test::UploadedFile` are two
different classes that both exist upstream — Rails' `test_process.rb:27`
constructs the rack-test one and hands it to a request that parses it into the
ActionDispatch one. Collapsing them into a single trails class would be the
inverse of fidelity. One loose end noted and *not* fixed here:
`packages/actionpack/src/action-dispatch/uploaded-file.ts` is a one-line
re-export of `./http/upload.js` at a path with no Rails counterpart
(`action_dispatch/uploaded_file.rb` does not exist). It predates this work and
is unrelated to rack-test; filed separately rather than folded in.

### The re-export shim

Not used here. RFC 0133 needed shims because it was **moving** code that
actionpack already imported by name; this RFC mostly **ports new code** and
then deletes actionpack's stand-ins, whose only callers are inside their own
files (`buildMultipartBody` is module-private; `MockSession` is a
non-exported class). Each collapse story deletes its stand-in in the same PR
that redirects its one call site.

## Non-goals

- **Driving `Integration::Session` through `Rack::Test::Session`.** That is
  `0104-twitter-app-full-stack-integration/converge-integration-session-to-rack-test-session`,
  already `ready` at 500 loc, and it is a much larger change than a relocation
  — it replaces trails' hand-rolled controller dispatch with a real middleware
  round-trip. This RFC's job is to make that story *possible* by putting
  `Rack::Test::Session` in the tree. `MockSession` is deleted by that story,
  not by this RFC. Filing a second story for the same work would duplicate an
  owned one.
- **Gating `rack-test` in `parity:api:extra:gate`.** Enrolling a package in
  `GATED_PACKAGES` is its own reviewed burndown.
- **Porting `Rack::Test::Utils#build_nested_query`
  (`utils.rb:11-32`) beyond what `build_multipart` needs.** trails' query
  building goes through `@blazetrails/rack`'s parser; the method is ported for
  surface and tested by `utils_spec.rb`, but no trails caller is redirected
  onto it in this RFC.
- **`Rack::Test::Session`'s `follow_redirect!` / `restore_state` /
  `with_session` multi-session support** as an actionpack-facing feature.
  Ported and tested against the gem's suite, but no actionpack caller is
  wired to them here.
- **Removing `packages/actionpack/src/action-dispatch/uploaded-file.ts` as part
  of a collapse story.** Pre-existing and unrelated to rack-test; it gets its
  own story, `remove-actionpack-uploaded-file-reexport`.

## Alternatives considered

- **Leave the stand-ins in actionpack and tag them `@noRailsEquivalent
  PERMANENT`.** Cheapest today. It permanently misprices 90 measurable public
  methods as invented actionpack surface, forfeits 234 creditable test names,
  leaves `--AaB03x` on the wire, and leaves a `ready` 0104 story with no
  prerequisite. Rejected: a receipt is a ledger row, not a fix (CLAUDE.md, "A
  documented deviation is debt").
- **Put it in `packages/rack` as `src/test/`.** One fewer package. But
  `vendor/rack` is pinned at `v3.1.14`, which does not contain `lib/rack/test/`
  — rack-test has been a separate gem since rack 1.x — so `parity:api` would
  compare a directory against nothing and `packages/rack`'s extra-surface
  figure would absorb the whole gem. Rejected: it reproduces the miscount in a
  different package. This is the same reasoning RFC 0133 used for
  `rack-session`.
- **`private: true` / devDependency-only, since it is a testing library.**
  Rejected on the three grounds in "Published, not devDependency-only":
  the gemspec says `add_dependency`, `strong_parameters.rb` names it from
  production code, and `Rack::Test::Methods` is surface trails users need.
- **Vendor as a read-anchor only (`compareApi: false`, like `date` /
  `minitest`).** Fixes the dangling citations and nothing else. Rejected: the
  two extractor runs above show both halves work unmodified, so the weaker
  contract buys nothing. `date` opts out because its surface is C; `minitest`
  because it has no TS package dir. Neither applies.
- **Vendor from RubyGems rather than git.** `vendor/sources.ts` has one origin
  shape (`type: "git"`) and all eight entries use it. Rejected for consistency;
  the tag `v2.2.0` is the released gem.

## Rollout

1. **Anchor.** `vendor-rack-test-source` — the `vendor/sources.ts` entry and
   lockfile row.
2. **Package.** `rack-test-package-skeleton` (deps: 1) — workspace package plus
   the four cross-package registrations.
3. **Tooling.** `enroll-rack-test-in-compare-tooling` (deps: 2) — `parity:api`
   and `parity:test` see the package; both report 0%, which is the honest
   baseline.
4. **CI.** `register-rack-test-in-ci-lanes` (deps: 2) — four lane
   registrations. Parallel with 3.
5. **Port**, leaf-first so each story is testable on landing:
   `port-rack-test-uploaded-file` → `port-rack-test-utils` →
   `port-rack-test-cookie-jar` → `port-rack-test-session` →
   `port-rack-test-session-redirects-and-state` → `port-rack-test-methods`
   (all dep on 3). `Session` is two stories, not one: the class is 320 lines and
   `test_spec.rb` carries 115 cases, so the request/response core and the
   redirect/cookie-mutator/state-restore group are split by member at RFC time
   rather than left to whoever claims the work.
6. **Collapse.** `collapse-actionpack-multipart-encoder-onto-rack-test-utils`
   (deps: `port-rack-test-utils`, `port-rack-test-uploaded-file`) and
   `converge-file-fixture-upload-onto-rack-test-uploaded-file` (deps:
   `port-rack-test-uploaded-file`).
7. **Unblock.** `0104`'s `converge-integration-session-to-rack-test-session`
   becomes buildable once `port-rack-test-session` lands. Owned by 0104; this
   RFC only records the edge.
8. **Unrelated cleanup**, carried because this scoping surfaced it:
   `remove-actionpack-uploaded-file-reexport`. Depends on nothing and can land
   at any point.

Thirteen stories, 3,210 loc estimated, none over the 400-loc ceiling.

## Verification

- `vendor/sources.ts` lists `rack-test` at `v2.2.0`; `pnpm vendor:fetch` in a
  fresh worktree lays down `vendor/rack-test/lib/rack/test.rb` and
  `vendor/rack-test/spec/`.
- `packages/rack-test` exists as a **published, non-private** workspace package
  with the three workspace dependencies `packages/rack-session` declares
  (`rack`, `ruby-compat`, `activesupport` — the last inherited from `Tempfile`'s
  current home), and `packages/actionpack`
  declares a plain `dependencies` entry on it, mirroring
  `actionpack.gemspec:41`.
- `pnpm parity:api` reports a `rack-test` row against 90 public methods
  (0 measurable today), with a non-negative delta at every step.
- `pnpm parity:test` reports `rack-test: 8 files, 234 tests` on the Ruby side,
  with a non-negative delta at every step.
- `grep -rn 'AaB03x' packages/` returns 0; the controller test-case encoder
  emits `Rack::Test::MULTIPART_BOUNDARY`.
- `grep -rn 'class MockSession' packages/actionpack/` returns 0 **after 0104's
  story**, not as part of this RFC.
- `packages/rack-test` appears in `RACK_PKGS_RE`, the Rack tests step, the
  non-AR coverage list and `AP_PKGS_RE` in `.github/workflows/ci.yml`, and its
  suite runs under a plain `pnpm vitest run packages/rack-test`.
- `pnpm parity:api` / `parity:test` deltas for `actiondispatch` and
  `actioncontroller` are non-negative throughout: nothing with a Rails `.rb`
  moves.

## Open questions

1. **Does `MANIFEST_PACKAGES` enrollment red the privates lint?** Same question
   RFC 0133 raised. The extractor reports 17 of rack-test's 90 methods as
   internal, so `blazetrails/rails-private-jsdoc` (autofixable) will demand
   `@internal` on ~17 members. Recommendation: land the enrollment and the
   autofix together in `enroll-rack-test-in-compare-tooling`, before any body
   is ported, so the fix is mechanical. 17 is small enough that this is not
   expected to need its own story.
2. **Does `Rack::Test::UploadedFile#method_missing`
   (`uploaded_file.rb:52-77`) need a trails idiom, or can the delegation be
   spelled out?** It forwards to the wrapped `Tempfile`. trails has a settled
   `method_missing` idiom; the port story picks it, and if the answer is "spell
   out the `IO` surface trails actually calls", that is a `@missingRailsCall`
   receipt at one site rather than a design change. Deferred to
   `port-rack-test-uploaded-file`.
3. **Does `packages/actionpack` depending on `@blazetrails/rack-test` close an
   import cycle?** rack-test depends on `rack`, `ruby-compat` and
   `activesupport`, all three of which actionpack already depends on, so the
   graph stays acyclic on paper. Flagged
   because CLAUDE.md's zero-import-slot section exists for exactly the case
   where that reasoning turns out to be wrong at module-eval time; verify with
   a plain-node import of the **built** `dist/**.js` in
   `rack-test-package-skeleton`, not with a vitest run.

## Changelog

- 2026-09-03: initial RFC
