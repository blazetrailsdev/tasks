---
title: "ruby-compat: rbFSend dispatches the core-receiver names basicObjRespondTo answers (to_sym, to_str, to_ary)"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `activerecord-converge-missing-control-flow-arms-associations` (trails#8353),
which added `toSym` to `packages/ruby-compat/src/object.ts`.

`basicObjRespondTo` (`packages/ruby-compat/src/object.ts`) answers `true` for `"toSym"` and `"toStr"`
on every JS string, `"toAry"` on a JS array, and `"isEmpty"` / `"isInclude"` on the core collection
receivers, because those values carry no such JS member (`vendor/ruby/v3.3.11/string.c:12212`,
`vendor/ruby/v3.3.11/array.c:8619`).

`rbFSend` / `rbFPublicSend` (`sendInternal`, same file; `vendor/ruby/v3.3.11/vm_eval.c:1330`) walk
the prototype chain only, so `rbFSend("posts", "toSym")` raises `NoMethodError` for a name
`rbObjRespondTo("posts", "toSym")` has just answered. In Ruby `respond_to?(:to_sym)` and
`send(:to_sym)` agree for a String.

## Acceptance criteria

- [ ] `sendInternal` dispatches the names `basicObjRespondTo` binds for core receivers to the ruby-compat function that implements each (`toSym`, and the existing ones for `toStr`, `toAry`, `isEmpty`, `isInclude`), so the two agree.
- [ ] Tests in `object.trails.test.ts` assert, per bound name, that `rbObjRespondTo` true implies `rbFSend` does not raise `NoMethodError`.
- [ ] `pnpm parity:api:extra:gate` green.
