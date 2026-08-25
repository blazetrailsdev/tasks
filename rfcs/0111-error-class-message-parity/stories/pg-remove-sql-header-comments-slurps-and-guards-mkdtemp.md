---
title: "removeSqlHeaderComments slurps the whole dump and raises an invented mkdtempSync error"
status: draft
updated: 2026-08-09
rfc: "0111-error-class-message-parity"
cluster: bare-error-throws
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `remove_sql_header_comments` streams the file line by line into a
`Tempfile` and copies it back
(`vendor/rails/activerecord/lib/active_record/tasks/postgresql_database_tasks.rb:124-137`):

```ruby
def remove_sql_header_comments(filename)
  removing_comments = true
  tempfile = Tempfile.open("uncommented_structure.sql")
  begin
    File.foreach(filename) do |line|
      unless removing_comments && (line.start_with?(SQL_COMMENT_BEGIN) || line.blank?)
        tempfile << line
        removing_comments = false
      end
    end
  ensure
    tempfile.close
  end
  FileUtils.cp(tempfile.path, filename)
end
```

trails (`packages/activerecord/src/tasks/postgresql-database-tasks.ts:198-230`)
instead reads the whole file into memory, splits on `\n`, scans an index forward,
`mkdtempSync`s a directory, writes, copies, and `rmSync`s. Differences that matter:

- **Whole-file read.** A structure dump of a large schema is loaded entirely into
  a string plus a line array; Rails streams.
- **`mkdtempSync` guard.** trails raises a trails-invented error
  ("PostgreSQLDatabaseTasks.structureDump requires FsAdapter.mkdtempSync…") when
  the configured `FsAdapter` lacks `mkdtempSync`. Rails has no such branch and no
  such message.
- **Blank-line test.** Rails uses `line.blank?`, which is true for a
  whitespace-only line; trails uses `lines[i].trim() === ""`, equivalent here but
  spelled without the ActiveSupport analogue the repo standard calls for.

This is the `remove_sql_header_comments` → `open` row (and, for the footer append,
the `structure_dump` → `open` row) in
`scripts/api-compare/call-mismatches-exclude/activerecord/tasks/postgresql-database-tasks.json`.

## Converged shape

Stream the file rather than slurping it, drop the `mkdtempSync` guard and its
invented error, and use the ActiveSupport `blank?` analogue for the blank-line
test. Whether a temp _directory_ or a temp _file_ backs it is a genuine
`FsAdapter` surface question — if `mkdtempSync` must stay, justify it at the call
site with the Ruby `Tempfile.open` cite rather than raising a bespoke error.

Retiring both `open` rows from the call-mismatch baseline is the measurable
outcome.

## Acceptance criteria

- [ ] `remove_sql_header_comments` streams instead of reading the whole file.
- [ ] The `mkdtempSync` capability check and its invented error message are gone.
- [ ] Both `open` rows are deleted from the call-mismatch baseline and
      `pnpm parity:api:calls` is green.
- [ ] `adapters/postgresql/postgresql-rake.test.ts` "structure dump header
      comments removed" (`postgresql_rake_test.rb:338-345`) stays green.
- [ ] Green on the PG lane.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
