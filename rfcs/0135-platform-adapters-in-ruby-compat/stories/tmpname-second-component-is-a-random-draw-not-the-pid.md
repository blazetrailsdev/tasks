---
title: "Dir::Tmpname.create's second name component is a second random draw where tmpdir.rb:154 uses $$"
status: in-progress
updated: 2026-09-05
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 36
pr: 7521
claim: "2026-09-05T16:00:46Z"
assignee: "copy-entry-drops-dereference-root-and-remove-destination"
blocked-by: null
closed-reason: null
---

## Context

`Dir::Tmpname.create` builds a candidate name from three parts
(`vendor/ruby/lib/tmpdir.rb:153-154`):

```ruby
t = Time.now.strftime("%Y%m%d")
path = "#{prefix}#{t}-#{$$}-#{RANDOM.next}"\
       "#{n ? %[-#{n}] : ''}#{suffix||''}"
```

The middle component is `$$`, the process id. `packages/ruby-compat/src/tempfile.ts`'s
`createTmpname` draws from `random()` a second time instead, and says so:

> Ruby's second name component is `$$`, the process id
> (`vendor/ruby/lib/tmpdir.rb:154`); trails has no `process.*`, so it is a
> second draw from {@link random}.

That justification is now stale. RFC 0135 moved the process adapter into
ruby-compat (`packages/ruby-compat/src/process-adapter.ts`), so a process id is
reachable from a leaf-safe seat — the comment predates the move.

Two temp files created in the same millisecond by different processes are
distinguishable in Ruby by construction and only probabilistically here. The
`Errno::EEXIST` retry loop makes a collision recoverable rather than fatal, so
this is a fidelity gap rather than a live bug.

## Converged shape

`Process.pid` (`vendor/ruby/process.c`, `rb_f_pid`, registered as
`Process.pid`) does not exist in `packages/ruby-compat/src/process.ts` yet, so
this story ports it first — the process adapter already reaches the underlying
value, and `Process` is the Ruby seat for it. Then `createTmpname`'s second
component becomes `Process.pid` and the `@noRailsEquivalent` prose about
"trails has no `process.*`" is deleted rather than reworded.

## Acceptance criteria

- `Process.pid` exists in `packages/ruby-compat/src/process.ts` with a
  `vendor/ruby/process.c:LINE` citation and a `@noRailsEquivalent PERMANENT`
  receipt, reading through the existing process adapter (no `process.*`).
- `createTmpname` spells the second name component `Process.pid`, matching
  `tmpdir.rb:154`.
- The stale "trails has no `process.*`, so it is a second draw" note is gone.
- `parity:api:extra:gate` passes; any `total` rise is one reviewed line sized to
  the export added.
