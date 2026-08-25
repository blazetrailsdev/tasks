---
title: "assert_difference/assert_changes String-expression arm and Rails-shaped source quoting"
status: done
updated: 2026-08-13
rfc: "0098-activesupport-ar-closure-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: 6460
claim: "2026-08-13T13:36:35Z"
assignee: "converge-async-sum-nil-identity-default"
blocked-by: null
closed-reason: null
---

## Context

Rails' `assert_difference`, `assert_changes` and `assert_no_changes` accept a
String expression and `eval` it against the block's binding
(activesupport/lib/active_support/testing/assertions.rb:110-111, 186, 192):
`assert_difference 'Article.count'`. `assert_changes` additionally accepts a
Symbol (`assert_changes :@object`), coerced with `to_s` before the eval.

trails' port (`packages/activesupport/src/testing/assertions.ts`, #6454) ports
only the callable arm; the file header documents why (TS has no binding to eval
against). The consequence is that the Rails test corpus' String-expression call
sites cannot be transcribed verbatim when AR tests are enrolled, which is the
form most of them use.

Related: `_callable_to_source_string` (assertions.rb:296-330) reads the
callable's source through `RubyVM::InstructionSequence` so the failure message
quotes the expression; trails uses `Function#toString`, which renders the whole
arrow function rather than Rails' trimmed body.

## Converged shape

Decide and implement the closest transcription for the String arm — most likely
a thunk-taking convention plus a documented mechanical rewrite for enrolled
tests — and trim `_callableToSourceString` output to the arrow body so the
failure text reads like Rails'.

## Acceptance criteria

- Enrolled AR tests can carry Rails' expression text in a recognizable form.
- Failure messages quote the expression, not the whole closure source.
