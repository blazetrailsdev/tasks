---
title: "Bump trails to main once activesupport loads without its optional msgpack peer"
status: draft
updated: 2026-10-08
rfc: "0136-trailmap"
cluster: null
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

trailmap#44 moved `vendor/TRAILS_PIN` to trails `c83105fc59` (the merge of
trails#8670) and could go no further. trails main at the time (`e8f1bb88fa`)
does not install: since trails#8674 `@blazetrails/activesupport` imports
`@blazetrails/msgpack` at load while declaring it an optional peer, so
`pnpm install` dies in `prepare` (`trails-tsc-views build`) with
`ERR_MODULE_NOT_FOUND`. `scripts/vendor-trails.sh` packs the closure of
`dependencies`, so an optional peer is never vendored.

The framework fix is the trails story
`message-pack-loaded-at-call-time-so-msgpack-is-an-optional-peer` (0184). This
story is the application half: take the next pin once that lands. It must not
be done by vendoring msgpack here, which would be working around the framework.

What the next pin brings that trailmap can feel: trails#8678 (a controller's
implied layout name is kebab-case; `render` takes a plain array as a
collection). trailmap has only `layouts/application` and renders no bare
records, so no application change is expected.

## Acceptance criteria

- Blocked until the trails msgpack story is merged; then `vendor/TRAILS_PIN` is
  bumped to a trails main that includes it, by `scripts/vendor-trails.sh` from
  a pack checkout with its build output cleaned, in its own PR.
- `pnpm install` succeeds with no `@blazetrails/msgpack` tarball in `vendor/`.
- `pnpm gate`, `gate:lists`, `gate:markdown`, `gate:snapshot` and
  `scripts/smoke-boot.sh` pass; the PR body carries screenshots.
