---
title: "capture_subprocess_io captures inherited child stdio"
status: in-progress
updated: 2026-10-30
rfc: "0211-rake-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9497
claim: "2026-10-30T16:17:02Z"
assignee: "capture-subprocess-io-for-rake-sh"
blocked-by: null
closed-reason: null
---

## Context

Rake's `test_sh_if_a_command_exits_with_error_status_its_full_output_is_printed` (`vendor/rake/v13.2.1/test/test_rake_file_utils.rb:317-331`) uses Minitest's `capture_subprocess_io`, which reopens the parent's stdout and stderr. `packages/rake/src/test-rake-file-utils.test.ts` instead redirects to `both.txt` in the shell, because an `out:` IO does not reach an inherited child's stdio.

## Acceptance criteria

- A `capture_subprocess_io` port captures output of children spawned with inherited stdio.
- The Rake test uses it and drops the `both.txt` redirect.
