---
title: "rbObjRespondTo(string, toStr) is true but a string has no toStr; converge Rake.from_pathname's guard"
status: draft
updated: 2026-11-10
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

`rbObjRespondTo("abc", "toStr")` answers true (ruby-compat's String method table
models Ruby's `String#to_str`), but a JS string primitive has no `toStr` member,
so `path.toStr()` throws `TypeError: path.toStr is not a function`. As a result
`Rake.from_pathname` (`vendor/rake/v13.2.1/lib/rake/file_list.rb:429-433`,
`path = path.to_str if path.respond_to?(:to_str)`) is ported in
`packages/rake/lib/file-list.ts` `fromPathname` with an extra
`typeof path !== "string" &&` guard that Rails lacks (trails#9957). The arm gate
does not see it, so it carries no receipt.

## Acceptance criteria

- [ ] The respond-to answer and the dispatch agree for a string receiver: either
      the `to_str` call site dispatches through ruby-compat (as `rbFSend` does for
      a string `toStr`), or the probe is converged per RFC 0194 native-first.
- [ ] `fromPathname` drops the `typeof` guard and reads as Rails' two lines.
- [ ] Grep the repo for other `typeof x !== "string" && rbObjRespondTo(x, "toStr")`
      guards and converge them the same way.
