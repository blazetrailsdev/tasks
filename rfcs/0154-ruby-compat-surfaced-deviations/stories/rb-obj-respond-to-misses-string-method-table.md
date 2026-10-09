---
title: "rbObjRespondTo does not answer the STRING_METHOD_TABLE names rbFSend now dispatches"
status: in-progress
updated: 2026-10-09
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: trails#8712
claim: "2026-10-09T15:30:53Z"
assignee: "rb-obj-respond-to-misses-string-method-table"
blocked-by: null
closed-reason: null
---

## Context

trails#8424 taught `rbFSend` (`packages/ruby-compat/src/object.ts`, `sendInternal`) to
dispatch a String receiver to a `STRING_METHOD_TABLE` entry
(`packages/ruby-compat/src/string/method-table.ts`) when the name is not on
`String.prototype`, so `rbFSend("abc", "upcase")` and `rbFSend("2000-01-01", "inTimeZone")` answer.
`basicObjRespondTo` / `rbObjRespondTo` (`object.ts`, MRI `basic_obj_respond_to`,
`vendor/ruby/v3.3.11/vm_method.c:2864-2879`) were not changed, so
`rbObjRespondTo("abc", "upcase")` still answers `false` for a method the send answers. In
MRI both read the same method table (`method_boundp`, `vm_method.c:1788-1818`), so the
two can never disagree. `rbStrRespondTo` (`method-table.ts`) already answers the table.

Related: `rb-f-send-string-receiver-reads-js-length-not-rb-str-length` (the table should
also win over a JS homonym such as `length`).

## Acceptance criteria

- [ ] `basicObjRespondTo` answers a String receiver through `rbStrRespondTo`, so it agrees with `rbFSend` for every `STRING_METHOD_TABLE` entry.
- [ ] Callers of `rbObjRespondTo` with a possibly-String receiver are audited for an arm that flips, and the audit is recorded in the PR body.
- [ ] A ruby-compat trails test pins `rbObjRespondTo("abc", "upcase")` true and `rbObjRespondTo("abc", "nope")` false.
