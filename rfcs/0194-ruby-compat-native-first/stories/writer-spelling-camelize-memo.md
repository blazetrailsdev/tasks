---
title: "ruby-compat: writerSpelling's regex camelize costs ~485 ns on every x= respond_to?/send"
status: in-progress
updated: 2026-10-23
rfc: "0194-ruby-compat-native-first"
cluster: dispatch-cost
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9266
claim: "2026-10-23T00:20:34Z"
assignee: "collapse-visibility-variants-of-send-and-respond-to"
blocked-by: null
---

## Context

`writerSpelling` (`packages/ruby-compat/src/object.ts:697-704`) runs
`name.replace(/_([a-zA-Z\d])/g, fn)` on every `x=` name. It is called from
`basicObjRespondTo` (`object.ts:642-643`) and `sendInternal`
(`object.ts:1042-1043`). Mass assignment
(`packages/activemodel/src/attribute-assignment.ts:66-69`) reaches both for
each attribute. Measured on dist: `rbObjRespondTo(p, "name=")` 1029 ns,
`rbFPublicSend(p, "name=", v)` 1077 ns, the camelize alone 485 ns.

## Acceptance criteria

- [ ] `writerSpelling` answers from a memo, or skips the regex when the name has no `_`. Same results for every input.
- [ ] A plain-node bench on dist shows `rbObjRespondTo(p, "name=")` under 550 ns, with the numbers in the PR body.
- [ ] The existing `object.trails.test.ts` writer-spelling cases pass unchanged.
