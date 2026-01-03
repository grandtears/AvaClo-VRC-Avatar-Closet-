import { useEffect, useMemo, useState } from "react";

type State = "idle" | "2fa_required" | "logged_in";
type TwoFAMethod = "totp" | "emailOtp";

type Avatar = {
  id: string;
  name: string;
  thumbnail: string;
  platform?: string;
  updatedAt?: string;
};

const API = "http://localhost:8787";

type BodyBase = {
  id: string;
  name: string;
};

/* 素体設定用 */
const BODY_BASES_KEY = "vam.bodyBases.v1";

function loadBodyBases(): BodyBase[] {
  try {
    const raw = localStorage.getItem(BODY_BASES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBodyBases(list: BodyBase[]) {
  localStorage.setItem(BODY_BASES_KEY, JSON.stringify(list));
}

function uid() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

// アバターID → 素体ID の対応表
type AvatarBaseMap = Record<string, string>;

const AVATAR_BASE_MAP_KEY = "vam.avatarBaseMap.v1";

function loadAvatarBaseMap(): AvatarBaseMap {
  try {
    const raw = localStorage.getItem(AVATAR_BASE_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAvatarBaseMap(map: AvatarBaseMap) {
  localStorage.setItem(AVATAR_BASE_MAP_KEY, JSON.stringify(map));
}

export default function App() {
  const [state, setState] = useState<State>("idle");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [methods, setMethods] = useState<TwoFAMethod[]>([]);
  const [method, setMethod] = useState<TwoFAMethod>("totp");
  const [code, setCode] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [error, setError] = useState("");

  const canPickEmail = useMemo(() => methods.includes("emailOtp"), [methods]);
  const canPickTotp = useMemo(() => methods.includes("totp"), [methods]);

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 50;

  const [totalAvatars, setTotalAvatars] = useState<number | null>(null);


  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "search">("list");

  const [searchOffset, setSearchOffset] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchTotal, setSearchTotal] = useState<number | null>(null);
  const [searchResults, setSearchResults] = useState<Avatar[]>([]);

  const [showSettings, setShowSettings] = useState(false);
  const [bodyBases, setBodyBases] = useState<BodyBase[]>(() => loadBodyBases());

  const [avatarBaseMap, setAvatarBaseMap] = useState<AvatarBaseMap>(() =>
    loadAvatarBaseMap()
  );

  async function doLogin() {
    setError("");
    setAvatars([]);
    setDisplayName("");

    try {
      const r = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      const j = await r.json().catch(() => null);

      if (!j?.ok) {
        setError("ログインに失敗（ID/Pass/サーバ未起動）");
        return;
      }

      if (j.state === "2fa_required") {
        const m = (Array.isArray(j.methods) ? j.methods : []) as TwoFAMethod[];
        setMethods(m);
        setMethod(m.includes("totp") ? "totp" : "emailOtp");
        setState("2fa_required");
        return;
      }

      setDisplayName(j.displayName || "");
      setState("logged_in");
    } catch {
      setError("APIに接続できません（localhost:8787）");
    }
  }

  async function do2fa() {
    setError("");

    try {
      const r = await fetch(`${API}/auth/2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ method, code })
      });

      const j = await r.json().catch(() => null);

      if (!j?.ok) {
        setError("2FAコードが違う/期限切れ/未ログイン");
        return;
      }

      setDisplayName(j.displayName || "");
      setState("logged_in");
    } catch {
      setError("2FA送信に失敗しました");
    }
  }

  async function loadAvatars(reset = false) {
    setError("");

    try {
      const nextOffset = reset ? 0 : offset;
      const r = await fetch(`${API}/avatars?n=${pageSize}&offset=${nextOffset}`, {
        credentials: "include",
      });
      const j = await r.json().catch(() => null);

      if (!j?.ok) {
        setError("アバター取得に失敗（未ログイン/セッション切れ）");
        return;
      }

      if (typeof j.total === "number") {
        setTotalAvatars(j.total);
      }

      const newItems: Avatar[] = j.avatars || [];
      setHasMore(!!j.hasMore);

      if (reset) {
        setAvatars(newItems);
        setOffset(newItems.length);
      } else {
        setAvatars((prev) => [...prev, ...newItems]);
        setOffset(nextOffset + newItems.length);
      }
    } catch {
      setError("アバター取得APIに接続できません");
    }
  }

  /* 検索関数 */
  async function searchAvatars(reset = false) {
    setError("");

    const q = query.trim();
    if (!q) {
      setError("検索ワードを入力してください");
      return;
    }

    try {
      const nextOffset = reset ? 0 : searchOffset;
      const r = await fetch(
        `${API}/avatars/search?q=${encodeURIComponent(q)}&n=${pageSize}&offset=${nextOffset}`,
        { credentials: "include" }
      );
      const j = await r.json().catch(() => null);

      if (!j?.ok) {
        setError("検索に失敗しました（未ログイン/セッション切れ）");
        return;
      }

      const total = Number(j.totalMatches);
      if (Number.isFinite(total)) setSearchTotal(total);

      const items: Avatar[] = j.avatars || [];
      setSearchHasMore(Boolean(j.hasMore));

      if (reset) {
        setSearchResults(items);
        setSearchOffset(items.length);
      } else {
        setSearchResults((prev) => [...prev, ...items]);
        setSearchOffset(nextOffset + items.length);
      }

      setMode("search");
    } catch {
      setError("検索APIに接続できません");
    }
  }



  useEffect(() => {
    if (state === "logged_in") {
      setOffset(0);
      loadAvatars(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  /* 素体情報の永続化 */
  useEffect(() => {
    saveBodyBases(bodyBases);
  }, [bodyBases]);

  /* 素体IDの永続化 */
  useEffect(() => {
    saveAvatarBaseMap(avatarBaseMap);
  }, [avatarBaseMap]);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>VRChat Avatar Viewer</h1>
        <button onClick={() => setShowSettings(true)}>⚙ 設定</button>
      </div>

      {error && (
        <div style={{ padding: 12, marginBottom: 12, border: "1px solid #f99", background: "#fee" }}>
          {error}
        </div>
      )}

      {state === "idle" && (
        <div style={{ maxWidth: 420, display: "grid", gap: 8 }}>
          <h2>ログイン</h2>
          <input
            placeholder="VRChat Username（メールは基本NG）"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={doLogin}>ログイン</button>
        </div>
      )}

      {state === "2fa_required" && (
        <div style={{ maxWidth: 480, display: "grid", gap: 8 }}>
          <h2>2段階認証</h2>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span>方式:</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as TwoFAMethod)}>
              <option value="totp" disabled={!canPickTotp}>Authenticator (TOTP)</option>
              <option value="emailOtp" disabled={!canPickEmail}>Email OTP</option>
            </select>
          </div>

          <input placeholder="6桁コード" value={code} onChange={(e) => setCode(e.target.value)} />
          <button onClick={do2fa}>送信</button>
        </div>
      )}

      {state === "logged_in" && (
        <div>
          {/* 上部ステータス */}
          <div style={{ marginBottom: 12 }}>
            Logged in as <b>{displayName || "(unknown)"}</b>
            {totalAvatars !== null && (
              <span style={{ marginLeft: 12 }}>（全 {totalAvatars} アバター）</span>
            )}
            <button
              style={{ marginLeft: 12 }}
              onClick={() => {
                // 一覧をリセットして再取得
                setMode("list");
                setQuery("");
                setSearchResults([]);
                setSearchTotal(null);
                setSearchOffset(0);
                setSearchHasMore(false);

                setOffset(0);
                loadAvatars(true);
              }}
            >
              再読み込み
            </button>
          </div>

          {/* 検索UI */}
          <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <input
              placeholder="全アバターから名前検索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, padding: 8 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") searchAvatars(true);
              }}
            />
            <button onClick={() => searchAvatars(true)}>検索</button>

            {mode === "search" && (
              <button
                onClick={() => {
                  setMode("list");
                  setSearchResults([]);
                  setSearchTotal(null);
                  setSearchOffset(0);
                  setSearchHasMore(false);
                }}
              >
                一覧に戻る
              </button>
            )}
          </div>

          {/* 検索時の件数表示 */}
          {mode === "search" && (
            <div style={{ marginBottom: 8 }}>
              検索結果: <b>{searchTotal ?? "…"}</b> 件
            </div>
          )}

          {/* 表示対象の切り替え */}
          {(() => {
            const shownAvatars = mode === "search" ? searchResults : avatars;
            const shownHasMore = mode === "search" ? searchHasMore : hasMore;

            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {shownAvatars.map((a) => (
                    <div key={a.id} style={{ border: "1px solid #ddd", padding: 8 }}>
                      <img
                        src={a.thumbnail}
                        style={{ width: "100%", borderRadius: 6 }}
                        loading="lazy"
                      />

                      <div style={{ marginTop: 6, fontWeight: 600 }}>{a.name}</div>
                      <small>{a.platform}</small>

                      {/* 素体割り当て UI */}
                      <div style={{ marginTop: 8 }}>
                        <select
                          value={avatarBaseMap[a.id] ?? ""}
                          onChange={(e) => {
                            const baseId = e.target.value;

                            setAvatarBaseMap((prev) => {
                              const next = { ...prev };
                              if (baseId) {
                                next[a.id] = baseId;
                              } else {
                                delete next[a.id];
                              }
                              return next;
                            });
                          }}
                          style={{ width: "100%" }}
                        >
                          <option value="">（素体なし）</option>
                          {bodyBases.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 現在の割り当て表示（任意だけどおすすめ） */}
                      {avatarBaseMap[a.id] && (
                        <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8 }}>
                          素体:{" "}
                          {bodyBases.find((b) => b.id === avatarBaseMap[a.id])?.name ?? "（不明）"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {shownHasMore && (
                  <div style={{ marginTop: 16 }}>
                    <button onClick={() => (mode === "search" ? searchAvatars(false) : loadAvatars(false))}>
                      もっと読む
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      {/* 設定モーダル */}
      {showSettings && (<SettingsModal bodyBases={bodyBases} setBodyBases={setBodyBases} onClose={() => setShowSettings(false)} />)}
    </div>
  );

  /**
   * 設定モーダル
   */
  function SettingsModal(props: {
    bodyBases: BodyBase[];
    setBodyBases: React.Dispatch<React.SetStateAction<BodyBase[]>>;
    onClose: () => void;
  }) {
    const { bodyBases, setBodyBases, onClose } = props;

    const [input, setInput] = useState("");

    function add() {
      const name = input.trim();
      if (!name) return;

      setBodyBases(prev => [
        ...prev,
        { id: uid(), name }
      ]);
      setInput("");
    }

    function remove(id: string) {
      setBodyBases(prev => prev.filter(b => b.id !== id));
    }

    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2>素体設定</h2>
            <button onClick={onClose}>✕</button>
          </div>

          {/* 追加 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              placeholder="素体名を入力（例：マヌカ）"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              style={{ flex: 1 }}
            />
            <button onClick={add}>＋</button>
          </div>

          {/* 一覧 */}
          <div style={{ display: "grid", gap: 6 }}>
            {bodyBases.map(b => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  border: "1px solid #ddd",
                  padding: 8,
                  borderRadius: 6
                }}
              >
                <span>{b.name}</span>
                <button onClick={() => remove(b.id)}>×</button>
              </div>
            ))}
            {bodyBases.length === 0 && (
              <div style={{ opacity: 0.6 }}>まだ素体がありません</div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

/* モーダルウィンドウのCSS */
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 8,
  padding: 16,
  width: 420,
  maxHeight: "80vh",
  overflowY: "auto",
};