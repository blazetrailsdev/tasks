---
rfc: "0237-stimulus-port"
title: "Port the stimulus-rails gem as @blazetrails/stimulus"
status: draft
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  - "stimulus"
  - "trailties"
clusters:
  - stimulus
---

# RFC 0237 — Port the stimulus-rails gem as @blazetrails/stimulus

## Summary

Port `stimulus` v1.3.4 as `@blazetrails/stimulus`. It covers the
Engine, `Stimulus::Manifest`, the node and bun `stimulus:install` arms, the
`stimulus:manifest:*` tasks, and `trails generate stimulus`. Part of the `hotwire-via-vite` meta RFC.

## Motivation

`AppBase#runHotwire` already calls `stimulus:install`, which nothing
defines. Measured: 5 `.rb` files plus 3 `.rb` templates, 146 LOC, 4 public
and 2 internal methods, and 14 upstream tests in 2 files. The JavaScript
under `app/assets/javascripts/` is the npm `@hotwired/stimulus` build and is
not ported.

## Design

`packages/stimulus` mirrors `lib/stimulus`, `lib/generators/stimulus`,
`lib/tasks` and `lib/install`. The node branch is ported verbatim,
`Stimulus::Manifest` included, so the generated `controllers/index.js` is a
static manifest (meta RFC open question 1). The install template writes to
the vite_rails entrypoint layout from the meta RFC's open question 3. The
generator lives in this package and is registered with trailties' generator
lookup, which is why `trailties` is in `packages`.

## Non-goals

- **`stimulus:install:importmap` and its template.** They depend on
  importmap-rails.
- **An `import.meta.glob` controllers index.** It would be new surface the gem
  does not have, unless the operator records it as a deviation.

## Alternatives considered

- **`import.meta.glob` in `controllers/index.js`.** See the meta RFC's open
  question 1. Not chosen by default.

## Rollout

1. `stimulus-package-and-install`.
2. `stimulus-controller-generator`.

## Verification

- `pnpm parity:api stimulus` reaches 4 public methods.
- `parity:test`: 14 = matched + `PERMANENT-SKIP`. The only allowed skip reason
  is an importmap-only arm.

## Open questions

None of its own. It follows the meta RFC's open questions 1 and 3.

## Changelog

- 2026-11-12: split out of the `hotwire-via-vite` meta RFC.
