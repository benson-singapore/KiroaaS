# Changelog

All notable changes to KiroaaS are documented here.

## [v1.2.3] - 2026-08-28

### Summary

This release adds configurable OpenAI Web Search budgets, improves budget exhaustion handling, and makes GitHub Releases update failures actionable.

### Added

- Added Web Search settings for maximum search rounds and total search time.
- Added regression coverage for bounded internal Web Search continuation.
- Added localized Releases-page fallback actions in the update checker.

### Changed

- Made Web Search limits configurable through the application settings and safely bounded in the backend.
- Started the search timer before the first MCP search and preserved results from searches that finish near or beyond the deadline.
- Kept Web Search continuation inside the gateway so clients receive the final Kiro response rather than raw search output.

### Fixed

- Fixed budget exhaustion causing an HTTP 508 and, in streaming requests, a follow-up HTTP 500 after the response had already started.
- Fixed update-check failures retaining stale results or showing an incorrect up-to-date state.
- Restored the Advanced Settings Thinking toggle alongside the new Web Search controls.

### Release automation

- Pushing the `v1.2.3` tag creates a GitHub Release after all macOS Apple Silicon, macOS Intel, Windows x64, and Linux x64 builds succeed.
- macOS packages use Ad-hoc signing without Apple notarization; users may need to choose Finder → Open or Privacy & Security → Open Anyway on first launch.

### Commits since v1.2.2

- Current working-tree changes: configurable Web Search budgets, streaming budget safeguards, update-check diagnostics, localized release actions, and regression coverage.

## [v1.2.2] - 2026-08-28

### Summary

This release improves cloud-account compatibility, expands localization, adds billing prompt handling, and fixes OpenAI Web Search so search execution remains internal to the gateway and clients receive the model's final answer.

### Added

- Added KiroaaS Cloud authentication and session-management integration.
- Added automatic `profileArn` discovery and host fallback for accounts without a profile ARN.
- Added Vietnamese language support and updated language selection.
- Added usage display improvements for free-trial and bonus usage.
- Added automatic local credential scanning and default configuration initialization.
- Added application update checks with OS and device information.
- Added GitHub Releases version checking with manual download links; automatic installation is intentionally disabled.

### Changed

- Added billing-header stripping to remove provider attribution from prompts.
- Added model-ID normalization for dash-format Claude model names.
- Added prompt role widening and tool-name aliasing compatibility extensions.
- Updated cloud-status display and chat-host fallback behavior.
- Updated the application data-directory handling for release builds.
- Updated dependency metadata and package-lock compatibility flags.

### Fixed

- Fixed OpenAI Web Search responses being emitted as final assistant content with `finish_reason=stop`. Search results are now returned to Kiro through an internal, bounded tool loop, and clients receive only the final model response.
- Fixed handling of server-side tool blocks in Anthropic tool results.
- Fixed missing `profileArn` and cloud-host resolution for accounts that do not provide complete profile metadata.
- Fixed model-name compatibility for dash-formatted Claude IDs.

### Release automation

- Added GitHub Actions packaging for:
  - macOS Apple Silicon (`aarch64`)
  - macOS Intel (`x86_64`)
  - Windows x64
  - Linux x64
- Pushing the `v1.2.2` tag creates a GitHub Release after all platform builds succeed and uploads the generated installers and archives.
- macOS packages use Ad-hoc signing without Apple notarization; users may need to choose Finder → Open or Privacy & Security → Open Anyway on first launch.

### Commits since v1.2.1

- `e8c3deb` feat(billing): add billing header strip extension to remove attribution from prompts
- `aa28fbc` feat(i18n): add Vietnamese language support and update language selection
- `2112863` feat: add peer flag to dependencies in package-lock.json
- `427d481` feat(chat): implement chat host fallback for accounts without profileArn
- `3499301` feat: refactor cloud status display logic in App component
- `f26632a` feat: update version to 1.2.1 across all configuration files
- Current working-tree changes: internal OpenAI Web Search tool loop, regression coverage, version `1.2.2`, and release automation.
