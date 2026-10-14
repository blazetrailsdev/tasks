---
title: "psych-to-ruby-keeps-non-string-hash-keys"
status: draft
updated: 2026-10-14
rfc: "0170-psych-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Psych::Visitors::ToRuby#revive_hash` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/visitors/to_ruby.rb:344-377`)
stores each key as `accept(k)` returned it, so `1: a` loads as `{1=>"a"}` and
`true: x` as `{true=>"x"}`. `packages/ruby-compat/src/psych/visitors/to-ruby.ts`
`reviveHash` revives an untagged mapping into a null-prototype plain object,
which stringifies every key (`{"1": "a"}`). trails#8904 made `symbolizeNames`
symbolize only String keys (`:371`), but the non-String key itself is still lost.

Per packages/ruby-compat/README.md "When a Ruby Hash is a Hash and when it is
an object", non-String keys are a `Hash` feature. Every `Psych.load` /
`unsafeLoad` consumer reads the result as a plain object today
(`activerecord/src/coders/yaml-column.ts`, `activesupport/src/configuration-file.ts`).

## Acceptance criteria

- [ ] A mapping with a non-String key (Integer, Float, true/false, nil, Symbol
      vs String distinction) revives into a ruby-compat `Hash` that keeps the key's
      type. A mapping whose keys are all Strings stays a plain object, or the
      story records the owner's ruling otherwise.
- [ ] Consumers that index the result are checked against the new shape.
- [ ] `psych.trails.test.ts` pins `Psych.unsafeLoad("1: a\n")` against `ruby -ryaml`.
