---
title: "Tempfile creates at the default umask and chmods to 0600 where tempfile.rb:158 passes perm: to open"
status: ready
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 170
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby creates a tempfile's backing file with the permission in the `open(2)`
call itself — `Tempfile#initialize` passes `opts[:perm] = 0600` into
`File.open` (`vendor/ruby/lib/tempfile.rb:158-159`), and `Tempfile.create`
does the same at `tempfile.rb:443-444`:

```ruby
Dir::Tmpname.create(basename, tmpdir, **options) do |tmpname, n, opts|
  mode |= File::RDWR|File::CREAT|File::EXCL
  opts[:perm] = 0600
  tmpfile = File.open(tmpname, mode, **opts)
end
```

`packages/ruby-compat/src/tempfile.ts`'s `openExclusive` cannot: `FsAdapter.openSync`
(`packages/ruby-compat/src/fs-adapter.ts`) takes `(path, flags)` and no mode, so
the file is created at the adapter's default permission and chmod'ed to `0600`
immediately afterwards:

```ts
tmpfile = File.open(path, "wx+");
File.chmod(0o600, path);
```

There is a window — the width of that one call — where a tempfile exists at the
default umask permission rather than `0600`. For a file whose whole purpose is
to hold content the process does not want other users reading, that window is
the point of the `perm:` argument.

## Converged shape

Give `FsAdapter.openSync` the mode `open(2)` already takes — the node adapter's
`fs.openSync(path, flags, mode)` supports it directly and the adapter object is
spread wholesale, so this is a declaration plus a pass-through. Then
`File.open` accepts Ruby's `perm:` and `openExclusive` drops the trailing
`chmod` rather than keeping it as a second step.

## Acceptance criteria

- `FsAdapter.openSync` accepts an optional mode and the node adapter forwards
  it.
- `File.open` carries Ruby's `perm:` argument (`vendor/ruby/io.c:8148`
  `rb_io_s_open`), cited.
- `openExclusive` in `packages/ruby-compat/src/tempfile.ts` creates at `0600`
  in one call and no longer chmods afterwards; the JSDoc paragraph excusing the
  two-step is deleted.
- A test asserts the created file's mode is `0600` without relying on the chmod.
