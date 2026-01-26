import type { AvatarBaseMap, AvatarFavMap, AvatarTagMap, BodyBase, FavFolder } from "./types";

const API = (window as any).VAM_API_URL || "http://localhost:8787";

type Settings = {
    bodyBases: BodyBase[];
    avatarBaseMap: AvatarBaseMap;
    favFolders: FavFolder[];
    avatarFavMap: AvatarFavMap;
    avatarTags: AvatarTagMap;
    confirmAvatarChange: boolean;
};

let cache: Settings = {
    bodyBases: [],
    avatarBaseMap: {},
    favFolders: [],
    avatarFavMap: {},
    avatarTags: {},
    confirmAvatarChange: false,
};

// ロード完了フラグ - これがtrueになるまで保存をブロック
let settingsLoaded = false;

// デバウンス用のタイマー
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 500;

// リトライ設定
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// ロード完了状態を取得
export function isSettingsLoaded(): boolean {
    return settingsLoaded;
}

// Async load from API (called by App.tsx on mount)
export async function fetchSettings(): Promise<Settings> {
    try {
        const res = await fetch(`${API}/settings`);
        if (res.ok) {
            const data = await res.json();
            // Merge with defaults
            cache = { ...cache, ...data };
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }
    // ロード完了をマーク（失敗しても完了とする。失敗時はデフォルト値を使用）
    settingsLoaded = true;
    return cache;
}

// リトライ付き保存
async function saveWithRetry(data: Settings, retries = MAX_RETRIES): Promise<boolean> {
    try {
        const res = await fetch(`${API}/settings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        return true;
    } catch (e) {
        console.error(`Failed to save settings (remaining retries: ${retries})`, e);
        if (retries > 0) {
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
            return saveWithRetry(data, retries - 1);
        }
        return false;
    }
}

// デバウンス付き保存（内部用）
function pushSettingsDebounced() {
    // ロード完了前は保存しない
    if (!settingsLoaded) {
        console.log("Settings not loaded yet, skipping save");
        return;
    }

    // 既存のタイマーをクリア
    if (saveTimer) {
        clearTimeout(saveTimer);
    }

    // デバウンス: 最後の変更から DEBOUNCE_MS 後に保存
    saveTimer = setTimeout(async () => {
        const success = await saveWithRetry({ ...cache });
        if (!success) {
            console.error("Failed to save settings after all retries");
        }
    }, DEBOUNCE_MS);
}

// Getters (Sync, read from cache)
export function getBodyBases(): BodyBase[] { return cache.bodyBases; }
export function getAvatarBaseMap(): AvatarBaseMap { return cache.avatarBaseMap; }
export function getFavFolders(): FavFolder[] { return cache.favFolders; }
export function getAvatarFavMap(): AvatarFavMap { return cache.avatarFavMap; }
export function getAvatarTags(): AvatarTagMap { return cache.avatarTags; }
export function getConfirmAvatarChange(): boolean { return cache.confirmAvatarChange; }

// Setters (Update cache & push with debounce)
export function saveBodyBases(list: BodyBase[]) {
    cache.bodyBases = list;
    pushSettingsDebounced();
}
export function saveAvatarBaseMap(map: AvatarBaseMap) {
    cache.avatarBaseMap = map;
    pushSettingsDebounced();
}
export function saveFavFolders(list: FavFolder[]) {
    cache.favFolders = list;
    pushSettingsDebounced();
}
export function saveAvatarFavMap(map: AvatarFavMap) {
    cache.avatarFavMap = map;
    pushSettingsDebounced();
}
export function saveAvatarTags(map: AvatarTagMap) {
    cache.avatarTags = map;
    pushSettingsDebounced();
}
export function saveConfirmAvatarChange(enabled: boolean) {
    cache.confirmAvatarChange = enabled;
    pushSettingsDebounced();
}

// Backward compatibility (deprecated names in App.tsx imports)
export {
    getBodyBases as loadBodyBases,
    getAvatarBaseMap as loadAvatarBaseMap,
    getFavFolders as loadFavFolders,
    getAvatarFavMap as loadAvatarFavMap,
    getAvatarTags as loadAvatarTags,
    getConfirmAvatarChange as loadConfirmAvatarChange
};
