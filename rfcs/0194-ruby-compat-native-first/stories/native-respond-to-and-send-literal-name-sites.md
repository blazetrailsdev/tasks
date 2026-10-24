---
title: "Native member access for rbObjRespondTo / rbFSend with a literal name on a receiver with no respondToMissing"
status: in-progress
updated: 2026-10-24
rfc: "0194-ruby-compat-native-first"
cluster: substitution
packages: []
deps: [basic-obj-respond-to-instance-fast-path, collapse-visibility-variants-of-send-and-respond-to]
deps-rfc: []
est-loc: 200
priority: null
pr: trails#9288
claim: "2026-10-24T21:20:37Z"
assignee: "native-respond-to-and-send-literal-name-sites"
blocked-by: null
---

## Context

`rbObjRespondTo` has 268 calls in 143 files, and `rbFSend` / `rbFPublicSend`
have 259 calls. Where the name is a literal and the receiver's class chain
defines no `isRespondTo` / `respondToMissing` (see the CLAUDE.md Proxy table),
the answer is the same as `typeof recv.m === "function"` / `recv.m(...)`. The
call gate does not score `send` or `respond_to?` (`lint-calls.ts:200-204`,
`compare.ts:419-428`).

## Acceptance criteria

- [ ] An inventory of literal-name sites, each classified as switch or keep, in the PR body.
- [ ] Sites follow the RFC's Visibility dispatch table.
- [ ] `ActiveModel::AttributeAssignment#_assign_attribute` (`packages/activemodel/src/attribute-assignment.ts:66-69`) writes `this[attr] = v` behind a native setter probe, keeping the `UnknownAttributeError` arm. A plain-node dist bench shows under 100 ns per assigned attribute, with the numbers in the PR body.
- [ ] Switched sites use the native form. Computed names, core-value receivers and `method_missing` receivers keep the helper.
- [ ] The sites `converge-four-divergent-public-send-ports` converged keep their helper calls.
