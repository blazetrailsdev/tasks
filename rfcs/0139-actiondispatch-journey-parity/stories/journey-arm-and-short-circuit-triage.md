---
title: "Journey arm and short-circuit triage, and the gated throw row to zero"
status: in-progress
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 7601
claim: "2026-09-08T02:07:31Z"
assignee: "journey-arm-and-short-circuit-triage"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:report --package=actiondispatch` reports **45 arm rows**
and **27 short-circuit rows** against `journey/**`:

| Token    | Missing | Invented |
| -------- | ------- | -------- |
| `if`     | 5       | 47       |
| `loop`   | 3       | 30       |
| `throw`  | 1       | 2        |
| `try`    | 0       | 1        |
| `rescue` | 0       | 1        |
| `or`     | 14      | 18       |
| `and`    | 2       | 9        |

Only missing-`throw` is gated (`scripts/api-compare/lint-arm-throws.ts`,
only-shrink over `arm-throw-mark.json`). The other tokens are report-only
because `docs/infrastructure/arm-mismatch-noise-floor.md` measured 62.5% of arm
rows to be non-real. This story therefore converges the gated row, reads every
row that DROPS a Rails branch, and does not chase the invented rows.

### The gated row is a real divergence

`journey/gtg/transition-table.ts#statesHashFor`, `missing=["if","if","throw"]`,
is actiondispatch's only `journey/` entry in `arm-throw-mark.json` (1 of the
package's 8).

Rails (`journey/gtg/transition_table.rb:200-213`) is a three-arm `case`:

```ruby
def states_hash_for(sym)
  case sym
  when String, Symbol then @string_states
  when Regexp
    if sym == DEFAULT_EXP then @stdparam_states else @regexp_states end
  else
    raise ArgumentError, "unknown symbol: %s" % sym.class
  end
end
```

trails (`transition-table.ts:229-231`) narrowed the parameter to `RegExp` and
kept only the inner `if`, hoisting the String/Symbol arm up into its caller
`addMemo` (`transition-table.ts:114-129`) and dropping the `else` raise
altogether. That is three Rails branches collapsed to one, plus a lost error —
the exact shape CLAUDE.md forbids ("do not collapse two Rails branches into
one... or drop a check you believe is unreachable"). The Symbol arm also needs
Ruby-Symbol handling: a Ruby Symbol is a JS string, and Rails accepts String
**or** Symbol here.

### The four other rows that drop a Rails branch

- `journey/formatter.ts#nonRecursive` — `missing=["loop","if"]`
- `journey/gtg/transition-table.ts#move` — `missing=["if"]`
- `journey/path/pattern.ts#offsets` — `missing=["loop","if"]`
- `journey/router.ts#findRoutes` — `missing=["loop"]`

Plus 16 missing short-circuits (14 `or`, 2 `and`), concentrated in
`journey/formatter.ts` — `buildCache` drops two `or`, `message` drops two `and`,
`generate` drops one `or`. Ruby's `||=` and `&&` guards frequently carry
semantics a JS rewrite loses: `||` is false for `0` and `""` where Ruby's is
false only for `nil`/`false`.

## Acceptance criteria

- `statesHashFor` mirrors Rails' three-arm `case`, including the String/Symbol
  arm (accepting both spellings) and the `ArgumentError` with Rails' exact
  message `"unknown symbol: %s"` rendered from the argument's class. The
  dispatch hoisted into `addMemo` returns to the helper.
- `arm-throw-mark.json` has no `journey/` entry under actiondispatch; the
  package total is narrowed 8 -> 7 with `pnpm parity:api:arms:throws:tighten`,
  never by hand and never reseeded.
- `pnpm parity:api:arms:throws` is green.
- Each of the other 4 missing-arm rows and 16 missing short-circuit rows gets a
  written verdict in the PR body — converged, or a language shortcoming with the
  Rails `file:line` and the reason. A dropped branch is the direction that hides
  bugs; none is left unread.
- The 77 invented arm rows and 27 invented short-circuits are **not** chased.
  Quote the noise-floor measurement rather than converging spellings.
- `pnpm parity:api --package actiondispatch` shows no regression on any other
  axis; converging `statesHashFor` must not add a call or arity mismatch.
