---
title: "Land the generated mini_magick package on main, registered in CI"
status: ready
updated: 2026-10-22
rfc: "0000-mini-magick-port-to-100"
cluster: mini-magick-land
packages: ["mini-magick", "ruby-compat"]
deps: ["vitest-matchers-rspec-matchers", "ruby-compat-deprecate-constant-and-file-executable"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The trails branch `mini-magick-port` (`5f96afb0a0`) holds:

- `b060c71f74`: `RUBY_VERSION = "3.3.11"` in ruby-compat
  (`vendor/ruby/v3.3.11/version.c:95`), which `image_spec.rb:85,92` guards two
  examples on;
- `9c7181ec6f`: the RSpec matchers (landed by `vitest-matchers-rspec-matchers`;
  drop the commit when rebasing);
- `5f96afb0a0`: `packages/mini-magick` (package.json, tsconfig.json, `src/`),
  the mini_magick entry in `vendor/sources.ts` (v5.2.0, `compareApi: false`,
  `compareTests: false`) and `vendor/sources.lock.json`, the spec fixtures at
  `packages/mini-magick/src/test-helpers/fixtures` (14 files, ~1.3 MB, copies
  of `vendor/mini_magick/v5.2.0/spec/fixtures`) and their exemptions in
  `.gitattributes`, `eslint.config.mjs`, `eslint/rails-private-jsdoc.config.mjs`,
  `.prettierignore` and `scripts/ci/check-control-bytes.sh`.

The specs shell out to ImageMagick (`convert`, `identify`, …; `magick` on IM7,
picked by `MiniMagick.imagemagick7?`, `mini_magick.rb:19-23`).

## Acceptance criteria

- A draft PR from `mini-magick-port` (rebased on `main`) lands the package,
  `RUBY_VERSION`, the vendor source and the fixtures.
- mini-magick is built and tested in CI like any other package; every guard that
  enumerates packages knows it, and the job that runs its specs has ImageMagick
  installed (the version recorded in the PR body).
- With the `ruby-compat-deprecate-constant-and-file-executable` story on `main`,
  every spec file loads. Each example that still fails is `it.fails` with a
  pointer to the story that fixes it, so `main` stays green; nothing else in
  the tree changes.
- The PR body states the starting numbers (passing examples, tsc errors) for
  the later stories to measure against.
