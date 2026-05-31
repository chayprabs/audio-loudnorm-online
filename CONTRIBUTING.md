# Contributing

Thank you for helping improve AudioSuite.

1. Fork the repository and create a topic branch from `main`.
2. Keep changes focused, tested, and documented.
3. Run the checks below before opening a pull request.

## Required checks

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pytest apps/worker/tests
```

Worker tests require `ffmpeg` and `libchromaprint-tools` (`fpcalc`) on your PATH.

## Commit style

Use conventional commit messages with a single-sentence subject line.

## Community

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [License](LICENSE)
