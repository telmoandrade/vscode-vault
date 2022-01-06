export interface VaultConfiguration {
    name: string;
    endpoint: string;
    auth: VaultConfigurationAuth;
}

export interface VaultConfigurationAuth {
    method: string;
    token: string;
    mountPoint: string;
    username: string;
    password: string;
}