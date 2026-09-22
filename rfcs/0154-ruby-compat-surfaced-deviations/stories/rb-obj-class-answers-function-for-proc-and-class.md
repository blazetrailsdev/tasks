---
title: "rbObjClass answers Function where Ruby answers Proc or Class"
status: draft
updated: 2026-09-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7984. `rbObjClass` (`packages/ruby-compat/src/object.ts:17`) is
`rb_obj_class` (`vendor/ruby/object.c:265`). For a JS function it answers the constructor's name,
`"Function"`, so every conversion error built through `rbBuiltinClassName` names a JS class Ruby
has no counterpart for: the String method table's `stringValue` raises `no implicit conversion of
Function into String` where MRI raises `no implicit conversion of Proc into String`
(`"a".include?(proc {})`). A class object has the same problem — Ruby's class of a Class is
`Class`, trails answers `"Function"`.

## Converged shape

`rbObjClass` answers `"Proc"` for a plain function (lambda / closure) and `"Class"` for a class
constructor (a function whose `prototype` carries its own members / `class` syntax), matching
`rb_obj_class` on the Ruby values those JS values stand for.

## Acceptance criteria

- `rbObjClass(() => 1)` is `"Proc"`; `rbObjClass(class Foo {})` is `"Class"`.
- `rbStrSend("abc", "isInclude", () => "a")` raises `TypeError` with
  `no implicit conversion of Proc into String`, and the trails test in
  `string/method-table.trails.test.ts` asserts the message.
- Call sites that relied on `"Function"` are audited (`grep -rn '"Function"' packages/*/src`).
