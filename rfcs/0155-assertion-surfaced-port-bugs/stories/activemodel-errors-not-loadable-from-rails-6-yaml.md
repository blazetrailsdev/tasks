---
title: "activemodel-errors-not-loadable-from-rails-6-yaml"
status: in-progress
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#7989
claim: "2026-09-22T23:11:04Z"
assignee: "abstract-adapter-inspect-renders-role-shard-as-strings"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `errors_test.rb`'s assertions (RFC 0132,
`assertions-activemodel-errors-cluster`), and confirmed by review of trails#7900.

`test "errors are compatible with YAML dumped from Rails 6.x"`
(`vendor/rails/activemodel/test/cases/errors_test.rb:680-703`) pastes a literal
Rails-6 Psych dump of an `ActiveModel::Errors` — `!ruby/object:` tags, an
anchor/alias pair for the shared `base`, and Symbol-valued `attribute` /
`type` / `raw_type` — loads it with `YAML.unsafe_load`, and asserts the
reconstructed object's `messages` and `details`, then that `clear` empties both.

The whole point of the test is the DESERIALIZATION path: it is a compatibility
guard against a dump written by an older Rails. trails has no Psych analogue —
there is no `YAML` module in any package (`YAMLEncoder` in
`packages/activemodel/src/attribute-set/yaml-encoder.js` is unrelated, it
encodes an `AttributeSet`) — so the first pass of trails#7900 replaced the body
with a freshly-constructed `Errors`, which asserts nothing about
compatibility and makes the named test vacuous.

Parked `it.skip` with
`BLOCKED: activemodel-errors-not-loadable-from-rails-6-yaml` in
`packages/activemodel/src/errors.test.ts`, with Rails' literal YAML restored
and the load reaching `YAML.unsafeLoad` through a declared local so the file
typechecks.

Decide first whether a Psych analogue belongs in trails at all. If it does not,
this story closes by saying so and by deciding what — if anything — guards
cross-version `Errors` compatibility instead; it does not close by asserting
something else under Rails' test name.

## Acceptance criteria

- `errors are compatible with YAML dumped from Rails 6.x` is un-skipped and
  loads Rails' literal dump, or the story is closed with the reasoning recorded.
