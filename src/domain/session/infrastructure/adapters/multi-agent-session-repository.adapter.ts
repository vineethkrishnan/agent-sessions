import type { Session } from "../../domain/session.model.js";
import type { SessionDetail } from "../../domain/session-detail.model.js";
import type { SessionRepositoryPort } from "../../application/ports/session-repository.port.js";
import type { SessionProviderPort } from "../../application/ports/session-provider.port.js";
import type { ProviderManagementPort } from "../../application/ports/provider-management.port.js";

export class MultiAgentSessionRepositoryAdapter
  implements SessionRepositoryPort, ProviderManagementPort
{
  private activeProviderId: string | null = null;

  constructor(private readonly providers: SessionProviderPort[]) {}

  async findAll(): Promise<Session[]> {
    const providersToSearch = this.activeProviderId
      ? this.providers.filter(
          (provider) => provider.name.toLowerCase() === this.activeProviderId?.toLowerCase(),
        )
      : this.providers;

    const results = await Promise.all(
      providersToSearch.map((provider) => provider.findAll().catch(() => [] as Session[])),
    );
    return results.flat().sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
  }

  async getDetail(filePath: string, providerName?: string): Promise<SessionDetail> {
    const provider = this.providers.find((candidate) => candidate.name === providerName);
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }
    return provider.getDetail(filePath);
  }

  getProviders() {
    return this.providers.map((provider) => ({
      id: provider.name.toLowerCase(),
      name: provider.name,
    }));
  }

  getActiveProvider() {
    if (!this.activeProviderId) return null;
    const provider = this.providers.find(
      (candidate) => candidate.name.toLowerCase() === this.activeProviderId?.toLowerCase(),
    );
    return provider ? { id: provider.name.toLowerCase(), name: provider.name } : null;
  }

  setActiveProvider(providerId: string | null) {
    this.activeProviderId = providerId === "all" ? null : providerId;
  }
}
