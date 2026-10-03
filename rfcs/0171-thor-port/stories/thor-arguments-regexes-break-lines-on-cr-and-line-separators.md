---
title: "Thor::Arguments regexes break lines on \\r / U+2028 where Ruby breaks on \\n only"
status: draft
updated: 2026-10-03
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `^` / `$` treat only `\n` as a line break. The JS `m` flag also breaks on `\r`, U+2028 and U+2029, so a regex ported as `/^…$/m` matches inputs Ruby rejects. trails#8462 converged `Thor::Options` (`packages/trailties/src/thor/parser/options.ts`) by dropping the `m` flag and spelling `^` as `(?<![^\n])`, `$` as `(?![^\n])` and `.` as `[^\n]`. The parent class still has the divergence, at three sites in `packages/trailties/src/thor/parser/arguments.ts`:

- `Arguments.split`: `/^-/m` (`vendor/thor/v1.3.2/lib/thor/parser/arguments.rb:12`). `"a\r-b"` breaks the loop in trails and not in MRI.
- `isNoOrSkip`: `/^--(no|skip)-([-\w]+)$/m` (`arguments.rb:56-59`). `"--no-foo\rbar"` answers `"foo"` in trails and `nil` in MRI, which reaches `Options#switch_option`, `parse_boolean` and `parse_peek` (`options.rb:230-236,258-287`).
- `isCurrentIsValue`: `/^-{1,2}\S+/m` (`arguments.rb:84-86`). `"a\r--b"` is not a value in trails and is one in MRI.

`argument.ts` and `option.ts` carry no `m`-flag regex.

## Acceptance criteria

- [ ] The three regexes break lines on `\n` only, spelled as in `options.ts`.
- [ ] `arguments.trails.test.ts` gains a case per site with a `\r` (and a U+2028) input, expectations checked against MRI running `vendor/thor/v1.3.2`.
