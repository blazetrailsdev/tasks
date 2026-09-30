---
title: "Port Thor::Options (the switch parser that replaces commander)"
status: draft
updated: 2026-09-30
rfc: "0000-thor-port"
cluster: null
packages: ["trailties"]
deps: ["port-thor-option", "port-thor-core-ext-hash-with-indifferent-access"]
deps-rfc: []
est-loc: 450
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/thor/v1.3.2/lib/thor/parser/options.rb` (294 lines): the regexes `LONG_RE` / `SHORT_RE` / `EQ_RE` /
`SHORT_SQ_RE` / `SHORT_NUM` / `OPTS_END` (`:3-8`), `self.to_switches` (`:11-26`), `initialize`
(`:32-59`, with relations for exclusive / at-least-one), `remaining`, `peek` (the `--`
terminator arm), `shift`, `unshift(arg, is_value:)`, `parse` (`:89-142`), `check_exclusive!`,
`check_at_least_one!`, `check_unknown!`, and protected `names_to_switch_names`,
`assign_result!` (repeatable arms), `current_is_switch?`, `current_is_switch_formatted?`,
`current_is_value?`, `switch?`, `switch_option`, `normalize_switch`, `parsing_options?`,
`parse_boolean`, `parse_peek`.

This is the parser trailties' `generators/base.ts` `dispatch` approximates today (no `-abc`
clustering, no `--`, no hash or array options, no `check_unknown!`; see
`generator-base-thor-initialize-arguments-and-options-parse`). commander stands in for it on
the command side (`packages/trailties/src/cli.ts`, `commands/*.ts`).

## Fidelity traps (predicted at authoring)

- [ ] **`case shifted when REGEX` binds `$1` / `$2`.** Each arm reads the match of _that_
      regex. Port each `when` as its own `exec` and keep the match.
- [ ] **`unshift($1.split("").map { |f| "-#{f}" })`** pushes an Array. `Arguments#unshift`
      splices arrays (`arguments.rb:76-82`).
- [ ] **`@is_treated_as_value`** is reset by `shift` and set by `unshift(is_value: true)`. An
      `--opt=-x` value must not be re-read as a switch.
- [ ] **`parse_boolean`'s value set** includes the Ruby `true` / `false` objects as well as the
      strings `t`/`T`/`TRUE`/`f`/`F`/`FALSE`.
- [ ] **`parse_peek`'s string arm** returns `option.lazy_default || option.default ||
option.human_name` (Ruby `||`: an empty-string default is kept).
- [ ] **`check_unknown!`'s** `/^--?(?:(?!--).)*$/` and `@stopped_parsing_after_extra_index`.
- [ ] **`class_name = self.class.name.split("::").last.downcase`** in the error messages
      (`"options"`), from the Ruby-name seat, as in `port-thor-argument-and-arguments`.
- [ ] **`to_switches`** uses Ruby `inspect` for Array and scalar values (`"--foo \"bar\""`),
      which is `rbInspect`.

## Acceptance criteria

- [ ] `options.rb` reads complete in `parity:api --package thor`.
- [ ] A trap-per-case `.trails.test.ts` covers the list above. The RSpec port is
      `port-thor-options-spec-part-1` / `-part-2`.
