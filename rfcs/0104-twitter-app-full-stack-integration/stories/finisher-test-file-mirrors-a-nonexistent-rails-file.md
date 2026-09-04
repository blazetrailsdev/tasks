---
title: "finisher.test.ts mirrors a Rails file that does not exist; TS-only tests need the .trails suffix"
status: done
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 20
pr: 7493
claim: "2026-09-04T19:50:50Z"
assignee: "type-registry-key-replaces-per-adapter-overrides"
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/application/finisher.test.ts` is named as a mirror of
`railties/test/application/initializers/finisher_test.rb`, and its header
comment says so — but **that Rails file does not exist**:

```console
$ ls vendor/rails/railties/test/application/initializers/
frameworks_test.rb  hooks_test.rb  i18n_test.rb  load_path_test.rb  notifications_test.rb
```

Rails has no `finisher_test.rb`. Every test in the trails file is therefore
trails-only, under trails-invented names ("add_generator_templates calls
ensureGeneratorTemplatesAdded", "registers the ported finisher initializers in
Rails order", …), sitting in a file `parity:test` maps to a Ruby file that
isn't there. The repo convention for TS-only tests is the `.trails.test.ts`
suffix — the sibling `application/executor-seam.trails.test.ts` already uses it.

trailties IS enrolled in `parity:test` (`scripts/test-compare/compare.ts:1355`),
so this is measured surface, not a free-form file.

The behaviors these tests cover DO have Rails homes, which is where the names
should come from when they move:

- `eager_load!` / `finisher_hook` → `hooks_test.rb:24` ("hooks block works
  correctly without eager_load (before_eager_load is not called)"), `:39`
  ("hooks block works correctly with eager_load"), `:54-87` (the four
  `after_initialize` ordering tests).
- `setup_default_session_store` → `railties/test/application/middleware/session_test.rb`.

Surfaced by PR #7295, which added tests to this file and matched its existing
shape rather than widening the divergence mid-PR.

## Converged shape

Rename to `finisher.trails.test.ts` so the TS-only tests stop claiming a
non-existent Rails counterpart, and move any test that DOES mirror a
`hooks_test.rb` case into a `hooks.test.ts` under its Rails name verbatim.

## Acceptance criteria

- No trails test file maps to `initializers/finisher_test.rb`.
- Tests mirroring `hooks_test.rb` cases carry Rails' names verbatim.
- `pnpm parity:test` trailties figures do not regress.
