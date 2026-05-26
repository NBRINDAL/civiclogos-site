function normalizeHost(host: string | null | undefined) {
  if (!host) {
    return "";
  }

  return host.toLowerCase().replace(/:\d+$/, "");
}

function isLocalHost(host: string) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]"
  );
}

export function shouldUseSecureCookies(args: {
  host?: string | null;
  protocol?: string | null;
} = {}) {
  const protocol = args.protocol?.toLowerCase() ?? "";
  const host = normalizeHost(args.host);

  if (protocol === "https" || protocol === "https:") {
    return true;
  }

  if (host && isLocalHost(host)) {
    return false;
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    try {
      return new URL(configuredSiteUrl).protocol === "https:";
    } catch {
      return configuredSiteUrl.startsWith("https://");
    }
  }

  if (process.env.VERCEL === "1") {
    return true;
  }

  return process.env.NODE_ENV === "production";
}
