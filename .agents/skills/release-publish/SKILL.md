---
name: release-publish
description: Project-local release and packaging skill for KiroaaS. Use this skill whenever the user asks to release, publish, package, bump the version, create a GitHub Release, push a release tag, or build installers for macOS Apple Silicon, macOS Intel, Windows, or Linux. It coordinates version confirmation, changelog generation, release workflow validation, guarded git operations, and post-release verification. Do not perform remote release actions until the user explicitly confirms the final version and authorizes commit, push, and tag creation.
---

# KiroaaS Release and Packaging

Use this skill for KiroaaS releases only. The project release path is intentionally gated because pushing a tag starts GitHub Actions and may publish public installers.

## Release contract

The release target is a semantic version such as `v1.2.2`. The repository currently uses these application version sources:

- `package.json` → `version`
- `package-lock.json` → root `version` and `packages[""].version`
- `src-tauri/Cargo.toml` → `[package].version`
- `src-tauri/tauri.conf.json` → `package.version`

Keep all four values synchronized to the tag version without the leading `v`. Treat `releases/latest.json` and `CHANGELOG.md` as release metadata, not as substitutes for the canonical application version sources.

The release workflow is `.github/workflows/release.yml`. It must build and upload artifacts for:

- macOS Apple Silicon (`aarch64`)
- macOS Intel (`x86_64`)
- Windows x64
- Linux x64

The expected release trigger is a tag matching `v*.*.*`. A normal branch push must not publish a release.

## Mandatory confirmation gates

### Gate 1: inspect before changing

Before editing anything, report:

1. Current application version from the canonical files.
2. Current branch and upstream.
3. Working-tree changes and whether they will be included.
4. The proposed new version and whether it is user-specified or automatically incremented.
5. Whether a release workflow already exists.
6. Required GitHub Actions secrets, especially Tauri updater signing secrets.

If the user has not supplied a version, ask whether to use a specified version or automatically increment the current version. Do not guess a major/minor/patch release when the choice matters.

### Gate 2: prepare locally

After the user confirms the version, but before remote operations:

1. Inspect commits since the previous version baseline. If no tag exists, identify the commit or version change that established the previous version and state the fallback baseline explicitly.
2. Synchronize all four canonical version sources.
3. Update `CHANGELOG.md` with date, summary, added/changed/fixed sections, and a concise commit summary. Do not claim a fix or feature that is not supported by the diff or commit history.
4. Update `releases/latest.json` only if this repository's updater endpoint requires the file. Preserve updater signatures and URLs unless the release process explicitly regenerates them.
5. Validate workflow YAML and confirm that the tag version must equal the project version.
6. Run relevant validation: frontend build/typecheck when dependencies are available, backend targeted tests when dependencies are available, Python compilation, JSON/TOML parsing, and `git diff --check`.
7. Show the user the complete proposed file list, release notes summary, validation results, and the exact tag that would be pushed.

At this point, stop and ask for explicit authorization to commit, push, and create the release tag if that authorization has not already been given for this exact version. Preparing files is not authorization to publish.

### Gate 3: commit and publish

Only after explicit authorization:

1. Re-check `git status`, branch, upstream, and the final version values.
2. Never discard unrelated user changes. If unrelated changes are present, ask whether to include them or separate them.
3. Stage specific release files; do not use `git add .`.
4. Create a focused commit, for example:
   `release: prepare v1.2.2`
5. Push the branch using the appropriate non-destructive command. Do not force-push.
6. Create and push an annotated tag:
   `git tag -a v1.2.2 -m "Release v1.2.2"`
   `git push origin v1.2.2`
7. Report the commit SHA, tag, and Actions URL.

Creating a tag is a consequential remote action because it triggers packaging and can publish a public GitHub Release. If the user authorized only a commit and branch push, do not create the tag.

## GitHub Actions requirements

Validate or create `.github/workflows/release.yml` with these properties:

- Trigger only on semantic version tags (`v*.*.*`).
- Use least-privilege `contents: write` permission for the publishing job.
- Validate that the tag version matches `package.json`, `Cargo.toml`, and `tauri.conf.json` before building.
- Build the Python backend with the repository's build entry point and package it into the Tauri resources expected by the application.
- Build the four target platforms in independent jobs or a matrix with `fail-fast: false`.
- Upload platform artifacts with `actions/upload-artifact`.
- Create the GitHub Release only after all platform builds succeed.
- Generate release notes from `CHANGELOG.md` and the commit range; include build artifact names.
- Pass Tauri signing values through Actions secrets, never hard-code keys or passwords.
- Fail clearly when no installer artifact is produced.
- Use pinned major action versions and avoid transmitting project data to unrelated services.

Check runner availability and Tauri version compatibility before relying on a particular macOS runner label. If the workflow uses cross-compilation, verify that Python/PyInstaller backend artifacts are compatible with the target OS and architecture; prefer native runners for the four requested packages.

## Post-release verification

After pushing the tag:

1. Check the GitHub Actions run for each platform.
2. Wait for the publish job only if the user asked for completion confirmation; otherwise report that it is running.
3. Verify the GitHub Release exists and is not a draft.
4. Verify all four platform artifact classes are attached.
5. Verify the release title, version, date, summary, fixes, and commit list.
6. If updater metadata is maintained in the repository or hosted endpoint, verify its version and platform URLs/signatures separately. Do not replace real signatures with placeholders.
7. Report failures with the failed job URL and the smallest corrective action; do not silently retry a release tag or create duplicate releases.

## Output format

Use this concise report:

```text
Current version: vX.Y.Z
Target version: vX.Y.Z
Baseline: <tag or commit>
Working-tree scope: <files included / unrelated changes noted>

Prepared:
- Version sources: synchronized / not synchronized
- Changelog: updated / not updated
- Workflow: validated / added / blocked

Validation:
- <check>: passed / blocked (reason)

Publish:
- Commit: <sha or not created>
- Tag: <tag or not created>
- Actions: <url or not triggered>
- Release: <url or pending / not created>

Summary:
- Added: ...
- Changed: ...
- Fixed: ...
- Packaging: macOS ARM64, macOS Intel, Windows x64, Linux x64
```

Always distinguish “prepared locally” from “published remotely”.
