---
title: "Port Helpers::ActionCableHelper#action_cable_meta_tag"
status: draft
updated: 2026-10-01
rfc: "0177-actioncable-package-port"
cluster: fidelity
packages: ["actioncable"]
deps: ["port-actioncable-server-connections-and-base"]
deps-rfc: []
est-loc: 150
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actioncable/lib/action_cable/helpers/action_cable_helper.rb` (45 lines), Tier 1. One method:

```ruby
def action_cable_meta_tag
  tag "meta", name: "action-cable-url", content: (
    ActionCable.server.config.url ||
    ActionCable.server.config.mount_path ||
    raise("No Action Cable URL configured -- please configure this at config.action_cable.url")
  )
end
```

Rails has no test for it in `actioncable/test`, `actionview/test` or
`railties/test` (`grep -rn action_cable_meta_tag vendor/rails/v8.0.2
--include=*_test.rb` is empty). The engine includes the module into
ActionView (`engine.rb:19-23`); that wiring is
`port-actioncable-engine`'s.

## Rails files owned by this story

- `vendor/rails/v8.0.2/actioncable/lib/action_cable/helpers/action_cable_helper.rb`

## Fidelity traps (predicted at authoring)

- [ ] **`tag` is the includer's method**, ActionView's `TagHelper#tag` (`packages/actionview/src/helpers/tag-helper.ts:127`). Port the module as a `this`-typed function over a host interface that has `tag`, so `packages/actioncable` takes no `@blazetrails/actionview` dependency.
- [ ] **`url || mount_path || raise`** is Ruby truthiness: an empty-string `url` is used as is.
- [ ] **The raise is a plain RuntimeError** with that exact message.
- [ ] **The two-argument `tag "meta", …` form** is the legacy call, which renders `<meta name="action-cable-url" content="…" />`.

## Acceptance criteria

- [ ] `action_cable_helper.rb` reads complete in `parity:api`.
- [ ] A `.trails.test.ts` covers `url` set, only `mount_path` set, and neither set.
- [ ] `packages/actioncable/package.json` has no `@blazetrails/actionview` dependency.

## Definition of done

Building the tag by string concatenation does not close this story.

## Verification

```bash
pnpm vitest run packages/actioncable/src/helpers/action-cable-helper.trails.test.ts
API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api --package actioncable   # each owned file at 100%
pnpm parity:api:calls && pnpm parity:api:calls:args && pnpm parity:api:params && pnpm parity:api:predicates && pnpm parity:api:extra:gate
pnpm lint
```
