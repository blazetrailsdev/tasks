---
title: "Vendor rails/web-console v4.3.0"
status: draft
updated: 2026-11-19
rfc: "0000-web-console-gem-port"
cluster: vendor
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

web-console 4.3.0 is the latest release on rubygems.org. Add it to
`vendor/sources.ts` in trails as `rack-cors` is (`vendor/sources.ts:275-290`):
origin `https://github.com/rails/web-console.git`, ref `v4.3.0`,
`libPath: "lib/web_console"`, entry `lib/web_console.rb`.

## Acceptance criteria

- [ ] `pnpm vendor:fetch` populates `vendor/web-console/v4.3.0/`.
- [ ] `pnpm parity:api` and `pnpm parity:test` list the package with 0 ported.
