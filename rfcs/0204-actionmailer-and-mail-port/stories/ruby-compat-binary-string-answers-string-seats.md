---
title: "ruby-compat-binary-string-answers-string-seats"
status: in-progress
updated: 2026-11-06
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9768
claim: "2026-11-06T02:07:05Z"
assignee: "mail-message-parses-binary-raw-source"
blocked-by: null
closed-reason: null
---

## Context

`basicObjRespondTo` (`packages/ruby-compat/src/object.ts`) answers a binary
String (`Uint8Array`) only from `BINARY_METHOD_TABLE` and the Object chain.
The String seats a JS string reaches (`STRING_METHOD_TABLE`, reopened String
methods such as ActiveSupport's `isBlank`, Kernel `dup`) answer false for it, where Ruby's
`"x".b.respond_to?(:blank?)` and `respond_to?(:dup)` are true:
`basic_obj_respond_to` walks the String class whatever the encoding
(`vendor/ruby/v3.3.11/vm_method.c:2864`). Found in review of trails#9701;
not a regression of that PR.

## Acceptance criteria

- `rbObjRespondTo(bytes, m)` answers true for each reopened-String / Kernel
  name a JS string answers and that `rbFSend` can dispatch on a Uint8Array.
- A test covers `dup` and a reopened String method on a Uint8Array.
