---
title: "Generated $~ and $n bind the match natively"
status: ready
updated: 2026-10-17
rfc: "0185-ruby-ts-codegen"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `$~`, `$1` … `$9` read the last match of the current frame. In the codegen generator they lower to generated-runtime shim helpers, `rbBackref` and `rbBackrefNth` (`scripts/codegen/src/runtime-shim.ts`), with 12 uses in generated activerecord. The repo owner ruled that no generated runtime ships.

The Ruby sources are:

- `$~` is `rb_backref_get` (`vendor/ruby/v3.3.11/vm.c:1802`);
- `$&` is `rb_reg_last_match` (`re.c:1882`);
- `$n` is `rb_reg_nth_match` (`re.c:1857`).

JS has no frame-local last match. The native form is to bind the match where it is made (`const m = re.exec(s)`, or `s.match(re)`) and read `m[n]`, so the generator should do that whenever the matching call is in the same method.

## Acceptance criteria

- [ ] The generator binds the match natively and reads `m[n]` wherever `$~` / `$n` follow a `=~`, `match` or `scan` in the same method.
- [ ] For any case that cannot be bound locally, ruby-compat exports a frame-scoped backref port with the `vm.c` / `re.c` citations and tests. If the generator covers every activejob and activerecord site, this criterion closes with a note instead.
- [ ] `rbBackref` and `rbBackrefNth` are deleted from `runtime-shim.ts`.
