---
title: "Port Warden::SessionSerializer and its two specs"
status: draft
updated: 2026-11-03
rfc: "0220-warden-gem-port"
cluster: warden-core
packages: ["warden"]
deps: ["warden-package-setup"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/warden/session_serializer.rb:1-53`: `initialize(env)` (`:7-9`),
`key_for(scope)` (`"warden.user.#{scope}.key"`, `:11-13`), `serialize` /
`deserialize` (identity, `:15-21`), `store(user, scope)` (`:23-28`) and
`fetch(scope)` (`:30-38`), each picking `"#{scope}_serialize"` /
`"#{scope}_deserialize"` with `respond_to?(method_name) ? send(...)`,
`stored?`, `delete`, and `session` (`env["rack.session"] || {}`, `:49-51`).

The scoped methods are added at run time by
`Manager.serialize_into_session` / `serialize_from_session`
(`manager.rb:69-92`, `send :define_method` / `send :remove_method`). Per RFC
Design §3 the reads keep `rbObjRespondTo` + `rbFSend` (computed name from an
application scope, an open set). The definer lands with `Manager`; this story
ports the reader and its spec.

Specs: `spec/warden/session_serializer_spec.rb` (7 examples) and
`spec/warden/scoped_session_serializer.rb` (9 examples; no `_spec` suffix, so
rspec's default pattern never runs it, but `warden-package-setup` makes the
extractor list it). Port both; the scoped examples call
`Warden::Manager.serialize_into_session`, so they land `it.skip` naming
`port-warden-manager`, which un-skips them.

## Acceptance criteria

- `session-serializer.ts` ports every `def`; `parity:api` credits the file.
- `session-serializer.test.ts` ports all 7 examples by name; the scoped file
  is ported or recorded as not extracted.
- `pnpm parity:api:sends` shows only the two computed-name sends.
