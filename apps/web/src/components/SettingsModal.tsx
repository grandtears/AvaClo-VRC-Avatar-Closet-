import React, { useState } from "react";
import type { AvatarBaseMap, BodyBase } from "../types";
import { uid } from "../utils";

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

export function SettingsModal(props: {
    bodyBases: BodyBase[];
    setBodyBases: React.Dispatch<React.SetStateAction<BodyBase[]>>;
    setAvatarBaseMap: React.Dispatch<React.SetStateAction<AvatarBaseMap>>;
    confirmAvatarChange: boolean;
    setConfirmAvatarChange: React.Dispatch<React.SetStateAction<boolean>>;
    onClose: () => void;
    onExport: () => void;
    onImport: (file: File) => void;
}) {
    const {
        bodyBases,
        setBodyBases,
        setAvatarBaseMap,
        confirmAvatarChange,
        setConfirmAvatarChange,
        onClose,
        onExport,
        onImport,
    } = props;

    const [input, setInput] = useState("");

    function add() {
        const name = input.trim();
        if (!name) return;

        setBodyBases((prev) => [...prev, { id: uid(), name }]);
        setInput("");
    }

    function remove(id: string) {
        setBodyBases((prev) => prev.filter((b) => b.id !== id));

        setAvatarBaseMap((prev) => {
            const next: AvatarBaseMap = { ...prev };
            for (const aid of Object.keys(next)) {
                if (next[aid] === id) delete next[aid];
            }
            return next;
        });
    }

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h2>素体設定</h2>
                    <button onClick={onClose}>✕</button>
                </div>

                {/* 全般設定 */}
                <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, margin: "0 0 8px 0" }}>全般</h3>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={confirmAvatarChange}
                            onChange={(e) => setConfirmAvatarChange(e.target.checked)}
                        />
                        アバター変更時に確認ダイアログを表示する
                    </label>
                </div>

                {/* データ管理 */}
                <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, margin: "0 0 8px 0" }}>データ管理</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={onExport}>
                            📥 エクスポート (JSON)
                        </button>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                            📤 インポート (JSON)
                            <input
                                type="file"
                                accept=".json"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                    if (e.target.files?.[0]) onImport(e.target.files[0]);
                                    e.target.value = "";
                                }}
                            />
                        </label>
                    </div>
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
                    {bodyBases.map((b) => (
                        <div
                            key={b.id}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                border: "1px solid #ddd",
                                padding: 8,
                                borderRadius: 6,
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
