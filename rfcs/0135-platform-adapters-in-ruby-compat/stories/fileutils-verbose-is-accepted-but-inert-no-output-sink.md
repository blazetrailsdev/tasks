---
title: "FileUtils' verbose: kwarg is accepted but inert — fu_output_message has no sink in the ruby-compat leaf"
status: done
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 24
pr: 7476
claim: "2026-09-04T12:01:32Z"
assignee: "fileutils-rm-rf-is-spelled-rm-r-force-true"
blocked-by: null
closed-reason: null
---

## Context

Every `FileUtils` member landed by #7426
(`packages/ruby-compat/src/file-utils.ts`) accepts Ruby's `verbose:` kwarg and
does nothing with it. Ruby's members open with

```ruby
fu_output_message "rm#{force ? ' -f' : ''} #{list.join ' '}" if verbose
```

(`vendor/ruby/lib/fileutils.rb:1218`, and the same line in `mkdir_p` :367,
`cp` :874, `mv` :1158, `rm_r` :1301, `touch` :2009), where
`fu_output_message` (`fileutils.rb:2496-2503`) writes to `@fileutils_output`
or `$stdout`:

```ruby
def fu_output_message(msg)
  output = @fileutils_output if defined?(@fileutils_output)
  output ||= $stdout
  if defined?(@fileutils_label)
    msg = @fileutils_label + msg
  end
  output.puts msg
end
```

The port accepts the kwarg for call-site parity — Rails passes
`verbose: false` at
`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:509` — but
`ruby-compat` has no `$stdout` to write to, so `verbose: true` silently prints
nothing. The class JSDoc records this today; the kwarg being accepted-but-inert
is the deviation.

Note the layering constraint that makes this non-trivial: `stdout` lives in
`@blazetrails/activesupport`, and `ruby-compat` is a leaf that cannot depend on
it. The output sink has to reach `FileUtils` the way the filesystem does —
through the backend contract — not by an import.

## Converged shape

- Give the backend contract an output sink (an `IOAdapter`-shaped member on the
  registration alongside `fs` and `path`, defaulting to the host's stdout in
  `tryAutoRegisterNode`), so `ruby-compat` can write without importing
  `activesupport`.
- Port `fu_output_message` as a module-private helper reading that sink, with
  the `@fileutils_label` prefix arm.
- Open each member's body with its `fu_output_message ... if verbose` line, in
  Ruby's exact message format — the `-f` / `-r` / `-p` / `-c` flag
  interpolations and `list.join ' '` included.

## Acceptance criteria

- `FileUtils.rm(list, { verbose: true })` and every other member print Ruby's
  exact message to the configured sink.
- `fu_output_message` is ported as a private helper with `@fileutils_label`.
- `ruby-compat` still imports nothing from `activesupport` (the leaf guard
  stays green).
- The "no `$stdout` to write to here, so nothing is printed" paragraph in
  `FileUtils`' class JSDoc is deleted, not reworded.
- A test asserts the message text for at least `rm`, `rm_f` and `mkdir_p`.
