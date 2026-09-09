---
title: "i18n's private sprintf duplicates Kernel#sprintf and should collapse onto ruby-compat"
status: ready
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 170
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7627's `Kernel#format` call-site audit.

`packages/i18n/src/interpolate/ruby.ts:60` carries a private, package-local
`sprintf(spec, value)` plus its helpers `numericArgument` (`:117`),
`twosComplement` (`:136`), `exponential` (`:166`) and `generalFormat` (`:170`).
It is a re-implementation of Ruby's `Kernel#sprintf`
(`vendor/ruby/sprintf.c:208` `rb_f_sprintf`, `:214` `rb_str_format`) — the
primitive `kernel-format-is-not-ported` will put in `@blazetrails/ruby-compat`.

Two things make this worth its own story rather than a line in that one:

1. **It is the better implementation.** The withdrawn #7627 port was measured
   against MRI and failed ten ways; this body already handles the
   two's-complement negative-radix form, `%g` general format, the alternate-form
   point and integer precision correctly. The ruby-compat port should be shaped
   FROM this body so the convergence here is a deletion, not a rewrite.
2. **It has a real blocker.** It raises `I18n`'s own `ArgumentError`
   (`packages/i18n/src/exceptions.ts:74`, which extends ruby-compat's) and a bare
   `TypeError`, and `ruby.trails.test.ts:146,157` assert on the I18n subclass via
   `toThrow(ArgumentError)`. A ruby-compat primitive raising the BASE class fails
   those assertions, because a base instance is not `instanceof` the subclass.
   Reconciling that is the actual work.

Note `blazetrails/no-ruby-compat-reimplementation` does not currently flag it:
the planned exports are `kernelFormat` / `kernelSprintf` (this package's
convention for Kernel methods, as `kernelInteger` / `kernelFloat` / `kernelRand`
already are), so the private name `sprintf` is not a registered alias. The lint
will not catch this for you.

## RFC placement

Filed under 0119 to sit beside its dependency, `kernel-format-is-not-ported`,
which is already there. There is no active i18n or ruby-compat RFC
(0074-i18n-parity is not active; 0129 and 0135 are superseded, 0138 closed),
no i18n `surfaced-deviations` bucket exists, and 0023 is retired as the
catch-all. Rehome if an i18n or ruby-compat RFC reopens.

**Depends on** `kernel-format-is-not-ported` — there is nothing to collapse onto
until that primitive exists.

## Converged shape

`interpolateHash` (`ruby.ts:31-52`) calls the ruby-compat primitive at its one
call site (`:47`), passing the spec with its leading percent, and `ruby.ts`
loses `sprintf` and all four helpers.

The error-class reconciliation is the decision to make, not to skip. Options, in
preference order: have the primitive raise ruby-compat's `ArgumentError` and
relax the two i18n assertions to it (the I18n subclass adds nothing here); or,
if I18n genuinely needs its own class at this boundary, catch and re-raise at
the `interpolateHash` call site so the subclass stays where Ruby's `I18n` puts
it. Do not duplicate the formatter to avoid the choice.

## Acceptance criteria

- [ ] `packages/i18n/src/interpolate/ruby.ts` declares no `sprintf` and none of
      its four helpers; the one call site goes through ruby-compat.
- [ ] The error class raised at the i18n boundary is decided explicitly and the
      reasoning recorded at the call site or in this story.
- [ ] `ruby.trails.test.ts` still pins the malformed-spec and
      non-numeric-argument raises, unrenamed.
- [ ] i18n and ruby-compat suites green.
