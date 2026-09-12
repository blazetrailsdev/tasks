---
title: "inspect-option-hashes-with-ruby-symbol-keys"
status: ready
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

A Ruby options hash is Symbol-keyed, and `Hash#inspect` on the pinned Ruby
(3.3.11 — `vendor/ruby/version.h`; `inspect_i` at `vendor/ruby/hash.c:3739`)
renders it `{:id=>false, :force=>"cascade"}`. Every trails site that inspects
an options hash renders it `{"id"=>false, "force"=>"cascade"}` instead,
because a trails option key is a bare JS string.

That representation is deliberate and repo-wide — `symbolizeKeys`
(`packages/activesupport/src/hash-utils.ts:125`) is `transformKeys(obj, key => key)`,
the identity, precisely because a bare JS key already stands for a Ruby
Symbol — so no single call site can fix it without diverging from every
other one. CLAUDE.md's settled idiom for a Symbol VALUE is the leading-colon
string (`":id"`), and `rbInspect` already honours it: `inspectValue`
(`packages/ruby-compat/src/object.ts:120`) returns an `isSymbol` string
verbatim, so `rbInspect({ ":id": false })` already renders `{:id=>false}`
today. What is missing is the decision about where an options hash crosses
from the JS spelling to the Ruby one.

Known sites (all inspect a Ruby Symbol-keyed hash):

- `packages/activerecord/src/migration.ts:1261` `formatArguments`
  (`activerecord/lib/active_record/migration.rb:1154`)
- `packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:1670,1743`
  (`schema_statements.rb` — `has no foreign key for #{options.inspect}`,
  `has no check constraint for`)
- `packages/activerecord/src/connection-adapters/postgresql/schema-statements.ts:1040,1164`
  (`postgresql/schema_statements.rb` — exclusion/unique constraint)
- `packages/actionview/src/template/error.ts:105`
  (`actionview/lib/action_view/template/error.rb:63` — `details.inspect`)

Surfaced reviewing trails#7727, which routed the AR sites onto ruby-compat's
`rbInspect` and deleted a second, divergent renderer
(`relation/ruby-inspect.ts`) that emitted the Ruby 3.4+ `{id: false}`
shorthand the pinned Ruby never produces. That PR removed the
separator divergence; this story is the remaining key-type one.

## Acceptance criteria

- One decision, applied at every site above: either the option-hash keys
  carry the Ruby Symbol spelling at the inspect boundary, or `rbInspect`
  learns the boundary — not a per-call-site transform.
- `formatArguments` renders `{:id=>false, :force=>"cascade"}`, matching
  `migration.rb:1154` on Ruby 3.3.11.
- The `migration.trails.test.ts` expectations that currently assert
  `{"id"=>false}` are updated to the Ruby string.
- `pnpm parity:api:calls` / `:calls:args` gain no rows — the boundary is a
  representation change, not an added call Rails does not make.
