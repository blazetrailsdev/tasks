---
title: "Thor parity:api: credit Thor::Invocation / Thor::Shell #initialize after constructor inlining"
status: done
updated: 2026-11-09
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: 3
pr: trails#9916
claim: "2026-11-09T13:20:31Z"
assignee: "port-help-and-version-commands-for-split-namespace"
blocked-by: null
closed-reason: null
---

## Context

Found at the 2026-11-09 refine. `pnpm parity:api --package thor` on origin/main (89f094d134) still misses
`Thor::Invocation#initialize` (`invocation.rb` 11/12) and `Thor::Shell#initialize` (`shell.rb` 19/20),
though RFC 0188's `thor-module-initializes-inlined` is done and inlined them into the includer
constructors. The inlined bodies are not credited back to the module rows.

## Acceptance criteria

- [ ] The two module `initialize` rows are credited (via the 0188 inlined-from manifest or the port shape
      the call gate expects), with no `[initialize]` hook reintroduced.
- [ ] `invocation.rb` and `shell.rb` read 100% in `parity:api --package thor`.
