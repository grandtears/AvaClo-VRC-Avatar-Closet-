import crypto from "node:crypto";
import { CookieJar } from "tough-cookie";
import makeFetchCookie from "fetch-cookie";

export type TwoFAMethod = "totp" | "emailOtp";

type Session = { jar: CookieJar };
const sessions = new Map<string, Session>();

const fetchCookie = makeFetchCookie(fetch);
const VRC_BASE = "https://api.vrchat.cloud/api/1";

const USER_AGENT =
    "VRChatAvatarManager/0.1";

function basicAuth(username: string, password: string) {
    const token = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
    return `Basic ${token}`;
}

export function createSession() {
    const sid = crypto.randomUUID();
    const jar = new CookieJar();
    sessions.set(sid, { jar });
    return sid;
}

export function hasSession(sid: string) {
    return sessions.has(sid);
}

function getSession(sid: string) {
    const s = sessions.get(sid);
    if (!s) throw new Error("NO_SESSION");
    return s;
}

async function readJsonSafe(res: Response) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

/**
 * ログイン（Basic認証で /auth/user）
 * 2FA必須の時は 200 で { requiresTwoFactorAuth: ["emailOtp"] } のように返る。
 */
export async function vrcLogin(
    sid: string,
    username: string,
    password: string
) {
    const { jar } = getSession(sid);

    const res = await fetchCookie(`${VRC_BASE}/auth/user`, {
        method: "GET",
        headers: {
            "User-Agent": USER_AGENT,
            "Authorization": basicAuth(username, password),
        },
        cookieJar: jar as any,
    } as any);

    const data = await readJsonSafe(res);

    if (!res.ok) {
        return { ok: false as const, status: res.status, body: data };
    }

    const methods = (data?.requiresTwoFactorAuth ?? []) as TwoFAMethod[];
    if (methods.length > 0) {
        return {
            ok: true as const,
            state: "2fa_required" as const,
            methods,
        };
    }

    return {
        ok: true as const,
        state: "logged_in" as const,
        user: data,
    };
}

/** 2FA（Email/TOTP）verify */
export async function vrcVerify2FA(sid: string, method: TwoFAMethod, code: string) {
    const { jar } = getSession(sid);

    const path =
        method === "emailOtp"
            ? "/auth/twofactorauth/emailotp/verify"
            : "/auth/twofactorauth/totp/verify";

    const res = await fetchCookie(`${VRC_BASE}${path}`, {
        method: "POST",
        headers: {
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ code }),
        cookieJar: jar as any
    } as any);

    const data = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body: data };

    // verify 後に user を確認（ログイン完了状態になる）
    const meRes = await fetchCookie(`${VRC_BASE}/auth/user`, {
        method: "GET",
        headers: { "User-Agent": USER_AGENT },
        cookieJar: jar as any
    } as any);

    const me = await readJsonSafe(meRes);
    if (!meRes.ok) return { ok: false as const, status: meRes.status, body: me };

    return { ok: true as const, user: me };
}

/** 自分のアバター一覧 */
export async function vrcGetMyAvatars(sid: string, n = 50, offset = 0) {
    const { jar } = getSession(sid);

    const url =
        `${VRC_BASE}/avatars?ownerId=me&releaseStatus=all` +
        `&n=${encodeURIComponent(String(n))}` +
        `&offset=${encodeURIComponent(String(offset))}`;

    const res = await fetchCookie(url, {
        method: "GET",
        headers: { "User-Agent": USER_AGENT },
        cookieJar: jar as any,
    } as any);

    const data = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body: data };

    return { ok: true as const, avatars: data };
}

/** 自分のアバター総数 */
export async function vrcCountMyAvatars(sid: string) {
    const { jar } = getSession(sid);

    let offset = 0;
    const n = 100;
    let total = 0;

    while (true) {
        const url =
            `${VRC_BASE}/avatars?ownerId=me&releaseStatus=all` +
            `&n=${n}&offset=${offset}`;

        const res = await fetchCookie(url, {
            method: "GET",
            headers: { "User-Agent": USER_AGENT },
            cookieJar: jar as any,
        } as any);

        const data = await readJsonSafe(res);
        if (!res.ok) return { ok: false as const, status: res.status, body: data };

        total += data.length;
        if (data.length < n) break;

        offset += n;
    }

    return { ok: true as const, total };
}