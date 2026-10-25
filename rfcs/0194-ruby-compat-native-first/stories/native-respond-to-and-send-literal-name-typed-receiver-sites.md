---
title: "Classify and switch the non-this literal-name rbObjRespondTo / rbFSend sites by receiver type"
status: done
updated: 2026-10-25
rfc: "0194-ruby-compat-native-first"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9305
claim: "2026-10-25T14:48:34Z"
assignee: "connection-base-new-tagged-logger-invented-function-arm"
blocked-by: null
closed-reason: null
---

## Context

trails#9288 (`native-respond-to-and-send-literal-name-sites`) classified one by one only the 21 literal-name `rbObjRespondTo` / `rbFSend` sites whose receiver is `this`. The other ~410 non-test sites (`grep -rnE 'rb(ObjRespondTo|FSend)\([^,]+, *"[^"]+"' packages --include=*.ts | grep -v '\.test\.ts'`) were covered by a blanket "core value or caller-supplied" verdict. The largest files are `packages/rack/src/lint.ts` (23), `activesupport/src/hash-utils.ts`, `activerecord/src/relation/query-methods.ts`, `actionview/src/helpers/form-helper.ts` and `actionpack/src/action-dispatch/routing/mapper.ts` (9 each).

RFC 0194's Visibility dispatch table: a trails-class receiver with no `respondToMissing` / `isRespondTo` in its chain and a literal name takes `typeof recv.m === "function"` / `recv.m(...)`. A core value, a CLAUDE.md Proxy row, or a `respondToMissing` definer keeps the helper.

Known trap: the call gate reads a `typeof recv.m` guard as a call to `m` (trails#9288 reverted `activerecord/src/migration.ts:1040` `change` for that reason, since it flipped `exec_migration`'s `change,revert` order). A property-typed member (`request` in `action-controller/metal/rendering.ts:77`) is not a `typeof … === "function"` site.

## Acceptance criteria

- [ ] Each non-`this` literal-name site is classified switch / keep by its receiver's static type, with the reason, in the PR body.
- [ ] Switch sites use the native form; core-value, Proxy-row and `respondToMissing` receivers keep the helper.
- [ ] `pnpm parity:api:calls`, `parity:api:calls:args` and `parity:api:sends` stay green.
