---
title: "Remove the src/ arms from layout tooling and add a no-src guard"
status: blocked
updated: 2026-11-13
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: layout-tooling
packages: [scripts]
deps:
  [
    lib-test-layout-actioncable,
    lib-test-layout-actionmailer,
    lib-test-layout-actionpack,
    lib-test-layout-actionview,
    lib-test-layout-activejob,
    lib-test-layout-activemodel,
    lib-test-layout-activerecord,
    lib-test-layout-activerecord-cli,
    lib-test-layout-activestorage,
    lib-test-layout-activesupport,
    lib-test-layout-arel,
    lib-test-layout-bcrypt,
    lib-test-layout-builder,
    lib-test-layout-chronic,
    lib-test-layout-date,
    lib-test-layout-did-you-mean,
    lib-test-layout-et-orbi,
    lib-test-layout-fugit,
    lib-test-layout-globalid,
    lib-test-layout-html-sanitizer,
    lib-test-layout-i18n,
    lib-test-layout-image-processing,
    lib-test-layout-mail,
    lib-test-layout-marcel,
    lib-test-layout-mini-magick,
    lib-test-layout-mini-mime,
    lib-test-layout-msgpack,
    lib-test-layout-net-smtp,
    lib-test-layout-nokogiri,
    lib-test-layout-raabro,
    lib-test-layout-rack,
    lib-test-layout-rack-session,
    lib-test-layout-rack-test,
    lib-test-layout-rackup,
    lib-test-layout-rake,
    lib-test-layout-ruby-compat,
    lib-test-layout-solid-cable,
    lib-test-layout-solid-queue,
    lib-test-layout-thor,
    lib-test-layout-trails-tsc,
    lib-test-layout-trailties,
    lib-test-layout-tse-compiler,
    lib-test-layout-tzinfo,
    lib-test-layout-vitest-matchers,
    lib-test-layout-zeitwerk,
  ]
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-11-13T00:49:50Z"
assignee: "lib-test-layout-retire-src-compat"
blocked-by: "waits on lib-test-layout-actionmailbox: packages/actionmailbox still lives under src/ (94 files), so the src arm is not dead yet"
---

## Context

`lib-test-layout-tooling-prep` made tooling accept both layouts while
packages migrated. Once every package story is done, the `src` arm is dead.

## Acceptance criteria

- [ ] `scripts/layout/package-roots.mts` and every caller assume `lib/` +
      `test/` only; the interim test excludes are gone.
- [ ] A Preflight test fails if any `packages/*/src/` directory (except `website`) or any
      `packages/*/lib/**/*.test.ts` exists.
- [ ] Root `CLAUDE.md` "Tests live next to source files" line reads "Tests
      live in `packages/<pkg>/test/`, laid out as the upstream gem's `test/`
      tree", if a package story has not already changed it.
- [ ] The two test-side `lib`-then-`src` probes are deleted:
      `packages/trailties/test/production-boot.trails.test.ts` (~line 31) and
      `packages/activesupport/test/cache/file-store-lock-worker-hooks.trails.mjs`
      (left in place by `layout-package-roots-named-exports-under-tsx-eval`).
