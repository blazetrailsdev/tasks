---
title: "chomp-newline-separator-must-strip-a-lone-cr"
status: draft
updated: 2026-09-02
rfc: "0129-ruby-compat"
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

`chomp(str, "\n")` (`packages/ruby-compat/src/string/chomp.ts`) is
`str.replace(/\r?\n$/, "")`, so it leaves a lone trailing `\r` in place:

```ts
chomp("x\r", "\n")  // => "x\r"
```

MRI strips it:

```console
$ ruby -e 'p "x\r".chomp("\n"), "x\ry".chomp("\n")'
"x"
"x\ry"
```

`rb_str_chomp` (`vendor/ruby/string.c:9786`) routes a separator equal to the
default `$/` through `chompped_length`'s smart-newline path
(`string.c:9700-9730`), which strips `\r\n`, a bare `\n`, **or** a bare `\r` —
i.e. `chomp("\n")` is the same operation as no-arg `chomp`, not a literal
suffix strip. Only a non-newline separator is the literal-suffix case.

The no-separator arm is already correct (`/(\r\n|\r|\n)$/`), and it is the arm
every current call site uses, which is why this has not surfaced. The
docstring also states the narrower rule (`"x\r\n".chomp("\n") == "x"`) without
covering the lone-`\r` case.

Surfaced in review of PR #7401, where `show_exceptions.rb:97`'s no-arg
`lines[lineno].chomp` was ported; the no-arg arm was used and is unaffected.

## Acceptance criteria

- `chomp(str, "\n")` strips a trailing `\r\n`, `\n`, or a lone `\r`, matching
  `chomp(str)`.
- A non-newline separator keeps the literal-suffix behaviour it has today.
- The docstring states the smart-newline rule, citing `string.c:9700-9730`.
- Covered by a test that fails on the current tree.
