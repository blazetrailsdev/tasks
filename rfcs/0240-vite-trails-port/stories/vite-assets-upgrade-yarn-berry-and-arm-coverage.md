---
title: "vite-assets upgrade: yarn berry verb and untested arms"
status: draft
updated: 2026-11-17
rfc: "0240-vite-trails-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/vite-assets/lib/cli/upgrade.ts` `upgradeRubyGems` (trails#10218) ports `vendor/vite_ruby/v3.11.1/vite_ruby/lib/vite_ruby/cli/upgrade.rb:13-19`. It runs `<packageManager> update|upgrade @blazetrails/vite-assets <libs>`, with `yarn` mapped to `upgrade`. Yarn 2+ (berry) has no `upgrade` command; it uses `yarn up`, so `bin/vite upgrade` fails in a berry app. `upgrade.test.ts` covers only the pnpm case. The yarn arm, the `ArgumentError` on an unknown manager, and `upgradeNpmPackages`' `exec("bin/vite upgrade_packages")` are untested.

## Acceptance criteria

- `upgradeRubyGems` issues a command yarn berry accepts (`yarn up`), or the yarn version is detected and the matching command is used.
- `upgrade.test.ts` covers the yarn arm, the unknown-manager `ArgumentError`, and the `upgradeNpmPackages` exec command.
