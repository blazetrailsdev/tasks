---
title: "Application.findRoot and the server's rackup default accept a compiled config.js"
status: draft
updated: 2026-11-23
rfc: "0258-ship-compiled-javascript"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Application.findRoot` (`trailties/lib/application.ts`) calls
`findRootWithFlag("config.ts", ...)`, so a compiled tree holding `config.js`
has no root: `configuration config.ts not found`. With a `config.ts` marker
in place, `commands/server` imports its `--config` default, `config.ts`, and
node throws `ERR_UNKNOWN_FILE_EXTENSION`. `command/actions.ts` checks
`File.isExist("config.ts")` to decide whether to `chdir`.

Rails finds `config.ru` with `find_root("config.ru")` and lets
`Rack::Builder.parse_file` load it, whatever produced it.

## Acceptance

- One helper resolves an application file by basename, trying `.ts` then
  `.js`. It is the helper `named-boot-loads-resolve-ts-then-js` reuses.
- `findRoot` finds a root marked by either `config.ts` or `config.js`.
- `server`'s `--config` default is `config.ts` when that exists and
  `config.js` otherwise. An explicit `--config` is taken as given.
- `command/actions` uses the same rule.
- Tests cover a fixture tree with only `.js` files, and one with both, where
  `.ts` wins.

## Found by

trailmap#198, via `compiled-app-cannot-boot-without-tsx` (RFC 0142), which
this story and the next supersede.
