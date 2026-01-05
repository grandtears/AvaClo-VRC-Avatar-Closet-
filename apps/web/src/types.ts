export type State = "boot" | "idle" | "2fa_required" | "logged_in";
export type TwoFAMethod = "totp" | "emailOtp";

export type Avatar = {
    id: string;
    name: string;
    thumbnail: string;
    platforms?: string[];
    updatedAt?: string;
    createdAt?: string;
    performance?: string;
};

export type BodyBase = {
    id: string;
    name: string;
};

export type AvatarBaseMap = Record<string, string>;

export type FavFolder = {
    id: string;
    name: string;
};

export type AvatarFavMap = Record<string, string>;

export type AvatarTagMap = Record<string, string[]>;
