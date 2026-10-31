---
title: "trails-tsc: type an attribute from its custom cast type, and allow a jsonb column a shape"
status: draft
updated: 2026-10-31
rfc: "0035-tsserver-editor-plugin"
cluster: null
packages: ["activerecord-cli"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails-tsc types a column from the schema, so a column with a custom attribute type keeps its storage type. trailmap's `Rfc` stores JSON arrays in text columns behind a `{ cast, dump }` coder, set in a `for` loop over the names, and `rfc.packages` is `string | null` where the runtime value is `string[]`. `ParityDay.gaps` is `jsonb`, which is `unknown` (`type-registry.ts`), and the app knows it as `Record<string, number> | null`. Both need a hand-written `declare` today.

Found by `typecheck-trailmap-with-trails-tsc-and-drop-model-declares`.

## Acceptance criteria

- An attribute given a type whose cast return type is known is typed from that type, with a test.
- There is a documented way to state a JSON column's shape without a `declare`, or the story records why a `declare` is the supported spelling.
- trailmap's `declare`s on `Rfc` and `ParityDay.gaps` naming this story are resolved.
