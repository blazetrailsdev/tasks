---
title: "Exception#toS converts its message with rbObjAsString (rb_String)"
status: draft
updated: 2026-10-18
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

MRI `exc_to_s` (`vendor/ruby/v3.3.11/error.c:1463-1469`) returns `rb_String(mesg)` for a non-nil message. trails#9022 put `Exception.prototype.toS` in `packages/ruby-compat/src/exception.ts` and converts with `String(mesg)`. It can't use `rbObjAsString` from `object.ts`: `object.ts` transitively loads classes that `extend Exception`, so `exception.js` loaded first throws `Cannot access 'Exception' before initialization` (reproduced against the built `dist`). As a result, a non-string message object never reaches its own `toS`.

## Acceptance criteria

- `Exception#toS` converts a non-nil message through `rbObjAsString` (MRI `rb_String`), without a load-order error when any exported subpath is loaded first (check with plain `node` imports of `dist/*.js`).
- Break the cycle with a sanctioned shape (a leaf module, like `classpath.ts`, or a namespace seat). Delete the JSDoc sentence that explains the `String` fallback.
- A test covers a message object whose `toS` is custom.
