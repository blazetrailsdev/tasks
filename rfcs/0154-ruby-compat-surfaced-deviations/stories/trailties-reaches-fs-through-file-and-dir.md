---
title: "trailties-reaches-fs-through-file-and-dir"
status: draft
updated: 2026-11-25
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split from `retire-getfs-and-getpath-public-exports` (its PR converged the
activesupport `encrypted-file.ts`, actionpack `screenshot-helper.ts`, rake
`rake-test-loader.ts` and activerecord-cli `auto-import.ts` lib callers).
trailties still reaches the filesystem through ruby-compat's `getFs()` /
`getPath()` in 15 lib files (`application.ts`, `application/configuration.ts`,
`engine.ts`, `generators.ts`, `generators/base.ts`,
`generators/actions/create-migration.ts`, `code-statistics.ts`,
`code-statistics-calculator.ts`, `command/actions.ts`, `commands/dbconsole.ts`,
`commands/unused-routes.ts`, `server/boot.ts`, `server/dev-server.ts`,
`server/main.ts`, `test-unit/test-parser.ts`) and 39 test files
(`grep -rl 'getFs\|getPath' packages/trailties`). Rails spells each through
`File` / `Dir` / `FileUtils` / `Pathname` (`vendor/rails/v8.0.5.2/railties/lib/...`).

## Acceptance criteria

- No file under `packages/trailties` imports `getFs` or `getPath`; each call
  uses the async `File` / `Dir` / `FileUtils` member matching its Rails line.
- trailties tests touched stay green.
