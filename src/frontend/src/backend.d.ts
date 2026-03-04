import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PrayerSettings {
    latitude: number;
    notificationsEnabled: boolean;
    calculationMethod: string;
    longitude: number;
    madhab: string;
    locationName: string;
}
export interface TasbihCounter {
    name: string;
    count: bigint;
    target: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addOrUpdateTasbihCounter(counter: TasbihCounter): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteTasbihCounter(name: string): Promise<void>;
    getCallerPrayerSettings(): Promise<PrayerSettings | null>;
    getCallerTasbihCounters(): Promise<Array<TasbihCounter>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPrayerSettings(user: Principal): Promise<PrayerSettings | null>;
    getTasbihCounters(user: Principal): Promise<Array<TasbihCounter>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    incrementTasbihCounter(name: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    resetTasbihCounter(name: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePrayerSettings(settings: PrayerSettings): Promise<void>;
}
