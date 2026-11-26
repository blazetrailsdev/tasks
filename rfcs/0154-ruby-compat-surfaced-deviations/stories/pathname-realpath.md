---
title: "Port Pathname#realpath and converge createPlaylistBlob"
status: draft
updated: 2026-11-26
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Pathname#realpath` (`vendor/ruby/v3.3.11/ext/pathname/pathname.c:295-300`) is
`Pathname.new(File.realpath(@path, basedir))`. ruby-compat's `Pathname`
(`packages/ruby-compat/lib/pathname.ts`) does not define it, so the
`createPlaylistBlob` port in `packages/activestorage/test/support/test-helper.ts`
(Rails `activestorage/test/test_helper.rb:59`, `file_fixture(referencing).realpath`)
spells `File.realpath(fileFixture(referencing).toString())`.

## Acceptance criteria

- Add `Pathname#realpath(basedir = null)` to ruby-compat, delegating to `File.realpath` as MRI does, returning a `Pathname`.
- Converge `createPlaylistBlob` to `fileFixture(referencing).realpath()`.
