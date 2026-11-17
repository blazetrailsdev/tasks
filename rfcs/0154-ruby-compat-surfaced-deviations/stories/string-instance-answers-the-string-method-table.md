---
title: "A String instance answers and dispatches every STRING_METHOD_TABLE name, not just actsLikeString"
status: draft
updated: 2026-11-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10219 made `Object#acts_like?` a bare `respond_to?` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/acts_like.rb:33-44`). `String#acts_like_string?` (`core_ext/string/behavior.rb:3-8`) is seated as `STRING_METHOD_TABLE.actsLikeString`, and that table is consulted only for `typeof obj === "string"`. Rails' test subclasses String (`class Stringish < String`, `activesupport/test/core_ext/object/acts_like_test.rb`), which ports as `class Stringish extends String`, a boxed String instance.

To make that one test pass, `packages/ruby-compat/lib/object.ts` now carries two arms that name the activesupport marker literally: `basicObjRespondTo` (`obj instanceof String && mid === "actsLikeString" && Object.hasOwn(STRING_METHOD_TABLE, mid)`) and the matching `sendInternal` dispatch. A first attempt that let a String instance answer every `STRING_METHOD_TABLE` name broke CI. Call sites that check `rbObjRespondTo(x, "toS")` and then call `x.toS()` directly (`rbObjAsString`, `rake/lib/file-list.ts`, `rake/lib/dsl-definition.ts`, `comparable.ts`, `rb-equal.ts`) threw `TypeError`.

In MRI an instance of a String subclass is a T_STRING. It answers, and dispatches, every String method (`basic_obj_respond_to`, `vendor/ruby/v3.3.11/vm_method.c:2864`).

## Converged shape

A String instance answers every `STRING_METHOD_TABLE` name in both `basicObjRespondTo` and `rbFSend`, by dispatching through `rbStrSend(recv.valueOf(), …)`. Each direct-member caller that probes respond_to is converged to dispatch through `rbFSend` (or a T_STRING check first, as `rb_obj_as_string` does at `vendor/ruby/v3.3.11/string.c:1653`). The `"actsLikeString"` literal leaves ruby-compat.

## Acceptance criteria

- No activesupport method name appears in `ruby-compat/lib/object.ts`'s String-instance arms.
- `rbObjRespondTo(new String("x"), m)` and `rbFSend(new String("x"), m)` agree for every table name.
- The secure-password, actiontext content and trailties authentication suites that broke on the broad arm stay green.
