---
title: "converge Persisted#find_session's first parameter onto the Ruby spelling"
status: draft
updated: 2026-09-02
rfc: "0133-rack-session-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby names the first parameter of `Persisted#find_session` `env`:

```ruby
def find_session(req, sid)
```

— actually the flagged pair is rack-session's own
`abstract/id.rb`'s `find_session(env, sid)`; trails spells the first parameter
`req` (`packages/rack-session/src/abstract/id.ts`, `findSession`). It is the one
remaining row in `pnpm parity:api --package rack-session --params`
(40/41 pairs, 97.6%), surfaced while gating #7408
(`converge-test-session-superclass`); nothing else in the package differs.

A local or parameter keeps the Rails identifier, camelCased (CLAUDE.md,
"Locals and parameters"), so this is a rename, not a judgement call — verify the
Ruby spelling at the `find_session` definition in
`vendor/rack-session/lib/rack/session/abstract/id.rb` before renaming, and rename
every override and call site with it.

## Acceptance criteria

- `findSession`'s first parameter is spelled as the vendored Ruby spells it, in
  the base and in every override.
- `pnpm parity:api --package rack-session --params` reports 41/41 (100%).
- `pnpm parity:api:params` green; rack-session's mark tightened with
  `pnpm parity:api:params:tighten` if it enrolls.
