export function uid() {
    return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function normalizeRank(x: unknown): string | null {
    if (!x) return null;
    const s = String(x).trim();
    if (!s) return null;
    // 表記揺れ吸収
    const u = s.toLowerCase();
    if (u.includes("excellent")) return "Excellent";
    if (u.includes("good")) return "Good";
    if (u.includes("medium")) return "Medium";
    if (u.includes("poor") && !u.includes("very")) return "Poor";
    if (u.includes("verypoor") || u.includes("very poor")) return "VeryPoor";
    return s;
}

export function getPerfRank(perf: any, platform: "standalonewindows" | "android"): string | null {
    if (!perf) return null;

    const asStr = normalizeRank(perf);
    if (typeof perf === "string" && asStr) return asStr;

    const p1 = perf?.[platform];
    const r1 = normalizeRank(p1?.rating ?? p1?.rank ?? p1);
    if (r1) return r1;

    const altKey =
        platform === "standalonewindows"
            ? perf?.pc ?? perf?.windows ?? perf?.win
            : perf?.quest ?? perf?.mobile ?? perf?.android;
    const r2 = normalizeRank(altKey?.rating ?? altKey?.rank ?? altKey);
    if (r2) return r2;

    const r3 = normalizeRank(perf?.rating ?? perf?.rank);
    if (r3) return r3;

    return null;
}

export function rankBadge(rank: string | null): string {
    if (!rank) return "-";
    if (rank === "Excellent") return "🟦 Excellent";
    if (rank === "Good") return "🟩 Good";
    if (rank === "Medium") return "🟨 Medium";
    if (rank === "Poor") return "🟧 Poor";
    if (rank === "VeryPoor") return "🟥 VeryPoor";
    return rank;
}
