---
title: "Port IO.popen's argv and block form to ruby-compat over the child-process adapter"
status: draft
updated: 2026-10-28
rfc: "0000-activestorage-port"
cluster: as-infra
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Previewer#capture` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/previewer.rb:78-91`) is
`IO.popen(argv, err: err) { |out| IO.copy_stream(out, to) }` followed by
`$?.success?` / `$?.exitstatus`, and `AudioAnalyzer#probe_from` /
`VideoAnalyzer#probe_from` (`analyzer/audio_analyzer.rb:56-71`,
`analyzer/video_analyzer.rb`) run `IO.popen([ffprobe_path, …])` and rescue
`Errno::ENOENT` when the binary is missing. ruby-compat has `Open3`
(`packages/ruby-compat/src/open3.ts`, over
`packages/ruby-compat/src/child-process-adapter.ts`) and `Process::Status`
(`process.ts`), but no `IO.popen`. MRI: `rb_io_s_popen`,
`vendor/ruby/v3.3.11/io.c`. `$?` is the RFC's open question 2.

## Acceptance criteria

- `IO.popen(argv, opts, block)` runs argv with no shell, honours `err:` as an
  IO redirect, yields a readable IO, answers the block's value, and raises
  `Errno::ENOENT` for a missing executable, each at its MRI citation.
- `$?` after the call is readable as the open question 2 ruling settles.
- `packages/ruby-compat` tests cover the success, non-zero exit and missing
  binary arms.
