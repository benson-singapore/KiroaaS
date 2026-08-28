import { getAppVersion } from './tauri';

const RELEASES_API_URL = 'https://api.github.com/repos/benson-singapore/KiroaaS/releases/latest';
export const RELEASES_PAGE_URL = 'https://github.com/benson-singapore/KiroaaS/releases';

export interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion?: string;
  currentVersion?: string;
  releaseName?: string;
  releaseNotes?: string;
  releaseUrl?: string;
  errorMessage?: string;
}

function parseVersion(version: string): number[] | null {
  const match = version.trim().replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = parseVersion(latest);
  const currentParts = parseVersion(current);
  if (!latestParts || !currentParts) return false;

  for (let index = 0; index < 3; index += 1) {
    if (latestParts[index] !== currentParts[index]) {
      return latestParts[index] > currentParts[index];
    }
  }
  return false;
}

interface GitHubRelease {
  tag_name?: string;
  name?: string | null;
  body?: string | null;
  html_url?: string;
  draft?: boolean;
  prerelease?: boolean;
}

/** Check the public GitHub Releases API without installing or invoking Tauri updater. */
export async function checkVersionUpdate(currentVersion?: string): Promise<UpdateInfo> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const resolvedCurrentVersion = currentVersion ?? await getAppVersion();
    const response = await fetch(RELEASES_API_URL, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('GitHub Releases 暂无已发布的正式版本（API 404）');
      }
      if (response.status === 403) {
        throw new Error('GitHub API 请求受限或已达到匿名访问频率限制（403）');
      }
      throw new Error(`GitHub Releases API 请求失败（HTTP ${response.status}）`);
    }

    const release = (await response.json()) as GitHubRelease;
    if (!release.tag_name || release.draft || release.prerelease) {
      return { hasUpdate: false, currentVersion: resolvedCurrentVersion };
    }

    const latestVersion = release.tag_name.replace(/^v/i, '');
    return {
      hasUpdate: isNewerVersion(latestVersion, resolvedCurrentVersion),
      currentVersion: resolvedCurrentVersion,
      latestVersion,
      releaseName: release.name || `KiroaaS v${latestVersion}`,
      releaseNotes: release.body || '',
      releaseUrl: release.html_url || RELEASES_PAGE_URL,
    };
  } catch (error) {
    const message = error instanceof DOMException && error.name === 'AbortError'
      ? 'GitHub Releases 请求超时（10 秒）'
      : error instanceof Error
        ? error.message
        : '无法连接 GitHub Releases API';
    console.error('[CheckUpdate] GitHub Releases check failed:', error);
    return { hasUpdate: false, errorMessage: message };
  } finally {
    window.clearTimeout(timeout);
  }
}
