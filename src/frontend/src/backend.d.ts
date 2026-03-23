import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Task {
    name: string;
    completed: boolean;
    baseAmount: bigint;
}
export interface Quest {
    tasks: Array<Task>;
    date: string;
    completed: boolean;
}
export interface Profile {
    xp: bigint;
    weight: bigint;
    streak: bigint;
    quest?: Quest;
    level: bigint;
    lastQuestDate?: string;
}
export interface backendInterface {
    completeTask(taskName: string): Promise<void>;
    getAllProfiles(): Promise<Array<Profile>>;
    getAllProfilesByLevel(): Promise<Array<Profile>>;
    getProfile(): Promise<Profile | null>;
    getQuest(): Promise<Quest>;
    initializeProfile(weight: bigint): Promise<void>;
}
