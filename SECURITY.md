# Security Policy

Please report security issues privately to the maintainers before public
disclosure.

## Supported versions

Only the latest `main` branch and tagged releases receive fixes.

## Handling uploads

- Uploaded files are processed in ephemeral worker directories.
- Artifacts are expected to be served through signed URLs with expiry.
- File contents and secrets must not be written to logs.
