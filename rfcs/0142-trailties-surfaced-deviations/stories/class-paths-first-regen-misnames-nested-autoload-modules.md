---
title: "class-paths first regen drops/misnames newly added nested Autoload modules"
status: draft
updated: 2026-11-11
rfc: "0142-trailties-surfaced-deviations"
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

On trails#9986, the first local `pnpm parity:class-paths` run after adding
`packages/actiontext/lib/attachable.ts` and `lib/attachables/*.ts` wrote a wrong
`packages/actiontext/lib/constants.generated.ts`:

- It left out `ActionText::Attachable` (`actiontext/lib/action_text/attachable.rb:18`).
- It named the nested classes `Attachables::ContentAttachment` / `MissingAttachable` /
  `RemoteImage` instead of `ActionText::Attachables::*`
  (`actiontext/lib/action_text/attachables/*.rb`).

`--check` rejected that table. A second plain run of
`pnpm exec tsx scripts/api-compare/class-paths.ts` wrote the correct table, with no
source change between the two runs. This looks like the same family as
`class-paths-local-regen-drops-source-annotation-rows`: the generator reads some
input (probably a cached manifest, or the namespace seats from a stale `dist`)
that is not refreshed before the first write.

## Acceptance criteria

- Find the input `class-paths.ts` reads that is stale on the first run, and refresh it or depend on it explicitly.
- A single `pnpm parity:class-paths` run after adding a nested module to a package writes the table that `--check` accepts.
- A regression test (or a scripted repro) covers a nested namespace module added under an Autoload namespace.
