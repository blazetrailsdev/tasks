---
title: "find_cmd_and_exec walks $PATH and stats for an executable, instead of returning the first candidate"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 21
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter.find_cmd_and_exec`
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:92-115`)
walks `$PATH` looking for an executable:

```ruby
def self.find_cmd_and_exec(commands, *args)
  commands = Array(commands)

  dirs_on_path = ENV["PATH"].to_s.split(File::PATH_SEPARATOR)
  unless (ext = RbConfig::CONFIG["EXEEXT"]).empty?
    commands = commands.map { |cmd| "#{cmd}#{ext}" }
  end

  full_path_command = nil
  found = commands.detect do |cmd|
    dirs_on_path.detect do |path|
      full_path_command = File.join(path, cmd)
      begin
        stat = File.stat(full_path_command)
      rescue SystemCallError
      else
        stat.file? && stat.executable?
      end
    end
  end

  if found
    exec full_path_command, *args
  else
    abort("Couldn't find database client: #{commands.join(', ')}. Check your $PATH and try again.")
  end
end
```

`packages/activerecord/src/connection-adapters/abstract-adapter.ts:1704-1712`
does none of it — it takes the first candidate and returns `[cmds[0], ...args]`:
no `$PATH` split, no `EXEEXT` suffixing, no `File.stat` executable check, and the
`abort` arm fires on an empty list rather than on "nothing found on `$PATH`". Its
three callers (`abstract_mysql_adapter.rb:82`, `sqlite3_adapter.rb:51`,
`postgresql_adapter.rb:89`) therefore pick a client that may not exist.

PR #7462 surfaced the innermost call as a baselined call-argument row
(`activerecord/connection-adapters/abstract-adapter.json`,
`join(ref:path, ref:cmd)`) when `File` left `CORE_CLASS_RECEIVERS` — there is no
`path` to join `cmd` onto because the loop it belongs to does not exist.

## Acceptance criteria

- `findCmdAndExec` mirrors the Ruby body arm for arm: `Array(commands)` widening,
  the `$PATH` split on `File::PATH_SEPARATOR`, the `EXEEXT` map (no-op where the
  runtime reports none), the `detect`/`detect` pair building
  `File.join(path, cmd)`, the `File.stat` rescue-else with
  `stat.file? && stat.executable?`, and both the found and `abort` arms with
  Rails' message verbatim.
- The `join(ref:path, ref:cmd)` row is removed from
  `scripts/api-compare/call-mismatches-exclude/activerecord/connection-adapters/abstract-adapter.json`
  (only-shrink: delete by hand, no reseed) and both call gates are green.
- Rails' `dbconsole_test.rb` cases for the three adapters are the coverage to
  port, with their names verbatim.
- The executable bit is read through the `FsAdapter` stat contract, not
  `node:fs`; add the member to the contract if it is missing.
