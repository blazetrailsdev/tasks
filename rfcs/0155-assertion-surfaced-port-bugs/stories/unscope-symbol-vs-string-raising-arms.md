---
title: "unscope-symbol-vs-string-raising-arms"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
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

`Relation#unscope` raises on two Ruby arms trails cannot currently express, because trails spells
a Ruby Symbol as a plain JS string and so cannot tell `:where` from `"where"`.

Rails `activerecord/lib/active_record/relation/query_methods.rb` (`unscope`) switches on the
argument's TYPE:

- `when Symbol` — a bare `:limit` is looked up in `VALID_UNSCOPING_VALUES`; a String falls
  through the `case` to the `else` and raises `ArgumentError`.
- `when Hash` — `raise ArgumentError` unless the KEY is the Symbol `:where`; the String
  `"where"` raises.

So `Developer.where(name: "Jamis").limit(3).unscope("limit")` and
`Developer.where(name: "Jamis").unscope("where" => :name)` both raise in Rails, while
`unscope(:limit)` and `unscope(where: :name)` do not
(`vendor/rails/activerecord/test/cases/scoping/default_scoping_test.rb:462-484`).

In trails every one of those spellings is the same JS string, so the raising arms are
unreachable and two tests are stuck at a partial assertion count:

- `scoping/default_scoping_test.rb > unscope errors with non where hash keys` — raises rails 2
  vs trails 1.
- `scoping/default_scoping_test.rb > unscope errors with non symbol or hash arguments` — raises
  rails 3 vs trails 1.

CLAUDE.md § "Ruby idioms that do not translate literally" already settles the shape for exactly
this case: where control flow turns on Symbol-vs-String, the Symbol keeps its leading colon
(`":where"`, `.slice(1)` for the name). Applying that to `unscope` is an API change reaching
every call site, which is why RFC 0132 filed it rather than doing it inside an assertion-parity
PR.

## Acceptance criteria

- Decide and record whether `unscope` adopts the colon-prefixed Symbol spelling or the two
  raising arms are permanently unreachable; if the latter, the receipt cites CLAUDE.md and the
  two tests are converged as far as the language allows.
- If it adopts the spelling, both Rails raise arms port and the two tests above report 0
  assertion mismatches.
- No test renames.
