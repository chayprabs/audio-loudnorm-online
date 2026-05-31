# Security Policy

Please report security issues privately before public disclosure.

## Reporting

Use [GitHub Security Advisories](https://github.com/chayprabs/audio-loudnorm-online/security/advisories/new)
for this repository, or email the maintainer via the contact listed on
[chaitanyaprabuddha.com](https://www.chaitanyaprabuddha.com).

## Supported versions

Only the latest `main` branch and tagged releases receive fixes.

## Handling uploads

- Uploaded files are processed in ephemeral worker directories.
- Artifacts are expected to be served through signed URLs with expiry.
- File contents and secrets must not be written to logs.
