---
title: "File.foreach lands on ruby-compat's File so remove_sql_header_comments can stream"
status: done
updated: 2026-09-10
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 41
pr: trails#7677
claim: "2026-09-10T21:00:07Z"
assignee: "exception-wrapper-tables-carry-bare-name-duplicate-keys"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while working `pg-remove-sql-header-comments-slurps-and-guards-mkdtemp`
(RFC 0111) in PR #7605, which is now blocked on this.

`File.foreach` has no trails counterpart. `packages/ruby-compat/src/io.ts:462`
ships `IO.readlines` (`vendor/ruby/io.c:12121` `rb_io_s_readlines`) and
`packages/ruby-compat/src/file.ts:358` ships `File.read`
(`vendor/ruby/io.c:12200` `rb_io_s_read`) — both whole-file reads. Nothing in
the package yields a file's lines one at a time.

Ruby's `File.foreach` is `rb_io_s_foreach` (`vendor/ruby/io.c:12063`), the
singleton form of `IO#each_line` (`io.c:4159` `rb_io_each_line`): it opens the
stream via `open_key_args` (`io.c:12163`), yields each line with the separator
retained, and closes through `rb_ensure` (`io.c:12180`). With no block it
returns an Enumerator.

Rails uses it directly, and at least one trails port has had to slurp instead:
`activerecord/lib/active_record/tasks/postgresql_database_tasks.rb:128` is
`File.foreach(filename) do |line|`, and
`packages/activerecord/src/tasks/postgresql-database-tasks.ts:186-201` ports it
as `File.read(filename).split(/(?<=\n)/)`, loading a whole structure dump into
a string plus a line array where Rails streams.

## Converged shape

- `File.foreach(name, block)` on `packages/ruby-compat/src/file.ts`, next to
  `File.read`, streaming through the registered `FsAdapter` rather than reading
  the file whole. Keep the separator on each yielded line, as `rb_io_each_line`
  does — `postgresql_database_tasks.rb:129-131` writes the line back verbatim
  and depends on it.
- Carry the `@noRailsEquivalent PERMANENT — Ruby core File.foreach
(vendor/ruby/io.c:12063)` receipt the sibling members use
  (`file.ts:355-357`, `io.ts:459`, `dir.ts:243`).
- Then converge `removeSqlHeaderComments` onto it and unblock
  `pg-remove-sql-header-comments-slurps-and-guards-mkdtemp`.

## The gate this has to clear

ruby-compat is pinned in the RFC 0117 extra-surface ratchet at `novel 0 /
total 58` with **zero headroom** — `pnpm parity:api:extra:gate` reports
`ruby-compat novel 0/0 (pinned), total 58/58`. The mark is only-shrink, so a
new public name reds it and raising the mark is not a remedy. A PERMANENT
receipt clears `novel` but NOT `total`, which stays gated in both modes.

So this story ships only alongside a `total` reduction, or as a reviewed step
of ruby-compat's own burndown that budgets for it. That sequencing is the work
here — do not open it as a bare "add one method" PR.

## Acceptance criteria

- [ ] `File.foreach` exists on ruby-compat's `File`, streams, and keeps the
      line separator.
- [ ] `postgresql-database-tasks.ts`'s `removeSqlHeaderComments` uses it and no
      longer reads the dump whole.
- [ ] `pnpm parity:api:extra:gate` is green — via a `total` reduction, not a
      raised mark.
- [ ] `adapters/postgresql/postgresql-rake.test.ts` "structure dump header
      comments removed" (`postgresql_rake_test.rb:338-345`) stays green.
