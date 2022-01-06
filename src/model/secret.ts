import { VaultMount } from "./mount";

export interface VaultSecret {
    name: string;
    mount: VaultMount;
}