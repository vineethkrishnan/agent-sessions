export interface ProviderInfo {
  id: string;
  name: string;
}

export interface ProviderManagementPort {
  getProviders(): ProviderInfo[];
  getActiveProvider(): ProviderInfo | null;
  setActiveProvider(providerId: string | null): void;
}
