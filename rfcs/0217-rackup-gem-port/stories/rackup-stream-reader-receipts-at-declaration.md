---
title: "rackup: receipt Stream::Reader's binary/buffer deviations at the declaration"
status: ready
updated: 2026-11-04
rfc: "0217-rackup-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/rackup/src/stream.ts` `Reader` (`vendor/rackup/v2.2.1/lib/rackup/stream.rb:24-130`) is a plain-object module. Its `readPartial` / `readNonblock` wrap `read_next` in `_binary(...)`, a call Rails does not make (`stream.rb:79, 106`), which stands in for `force_encoding(BINARY)` (`:51, :85`). Its `read` / `readNonblock` cannot fill a caller-supplied `buffer` (`:35-43`, `:109-126`), because a `Uint8Array` cannot be `replace`d (CLAUDE.md § "A String has no encoding tag either"). On trails#9695:

- an `@inventedArm _binary — PERMANENT` JSDoc on a member of the `Reader` object literal was reported by `blazetrails/no-freeform-comments` as an English-language comment;
- `@missingRailsCall replace|clear|force_encoding|slice! — PERMANENT` were reported stale by `parity:api:calls`, since String core calls are outside its population.

As a result, both deviations are recorded only in the PR body, not at the declaration.

## Acceptance criteria

- [ ] `no-freeform-comments` accepts receipt tags (`@inventedArm`, `@missingRailsCall`, `@missingRailsArgs`) on plain-object module members, the same as on class members, or else the arms gate writes skeleton rows for them.
- [ ] `stream.ts` `readPartial` / `readNonblock` carry `@inventedArm _binary — PERMANENT`.
- [ ] The caller-`buffer` deviation in `read` / `readNonblock` carries a receipt that some gate checks.
