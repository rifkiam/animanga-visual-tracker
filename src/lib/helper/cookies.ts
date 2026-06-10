export function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const prefix = `${encodeURIComponent(name)}=`;
    for (const part of document.cookie.split("; ")) {
        if (part.startsWith(prefix)) {
            return decodeURIComponent(part.slice(prefix.length));
        }
    }

    return null;
}

export function setCookie(name: string, value: string, maxAgeSeconds?: number) {
    if (typeof document === "undefined") return;

    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
    if (maxAgeSeconds !== undefined) {
        cookie += `; max-age=${maxAgeSeconds}`;
    }

    document.cookie = cookie;
}
