---
title: "require-table-teardown: translate ARE class shorthands inside bracket expressions"
status: in-progress
updated: 2026-07-29
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 5589
claim: "2026-07-29T18:46:12Z"
assignee: "require-table-teardown-translate-bracket-shorthands"
blocked-by: null
closed-reason: null
---

## Context

PR #5582 closed a leak in `bracketSource` (`eslint/require-table-teardown.mjs`):
it used to emit a backslash inside a bracket expression doubled, reading it as
bare POSIX's literal character. PostgreSQL's engine is ARE, which reads a
backslash inside brackets as an escape, so `~ '^ex[\d]'` was compiled to
`^ex[\\d]` and credited `exd` — a name the filter does not select. Since which
reading is right depends on the engine, the safe fix was to refuse any backslash
inside a bracket expression outright.

That refusal is under-accepting in the same way the pre-#5582 blanket escape
refusal was: `~ '^ex_[\d]+'` is a perfectly ordinary sweep filter that now
credits nothing, so its creates report `missingTeardown` as noise.
`ARE_SHORTHANDS` (the `\d` / `\w` / `\S` subset whose JS character set cannot be
the wider of the two) already encodes which shorthands are safe to translate
outside brackets; the same subset is translatable inside a JS character class,
where `[\d]` means exactly what `\d` does.

The care #5582 and #5578 took applies unchanged: a construct may only be
accepted when its JS meaning is no wider than its PostgreSQL one, never when it
merely looks similar. Note `bracketSource` is shared with `similarPrefixMatcher`
(`SIMILAR TO`), which carries its own `ESCAPE` character — the interaction
between that escape char and a backslash inside brackets needs to be settled
before widening the shared helper, and refusing remains correct for any case
that cannot be settled.

Filters emitted by Arel: `visit_Arel_Nodes_Regexp` /
`visit_Arel_Nodes_NotRegexp`,
`vendor/rails/activerecord/lib/arel/visitors/postgresql.rb:29,:34`.

## Acceptance criteria

- `~ '^ex_[\d]+'` and the other `ARE_SHORTHANDS` members inside a bracket
  expression are translated rather than refusing the whole filter.
- A backslash inside brackets that is NOT a safe shorthand (`[\W]`, `[\b]`,
  `[\1]`, a bare `[\\]`) still yields no matcher.
- The `SIMILAR TO` path is either widened deliberately with its `ESCAPE`
  interaction settled, or left refusing — not widened by accident through the
  shared helper.
- No matcher credits a name its filter does not select.
- Rule tests pin each newly accepted and each still-refused bracket escape, and
  the KNOWN GAPS paragraph is updated to match what is actually read.
