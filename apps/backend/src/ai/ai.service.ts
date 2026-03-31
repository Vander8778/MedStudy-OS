import { Injectable } from "@nestjs/common";
import { CapabilityRegistry } from "./capabilities/capability-registry";
import type {
  AiCapabilityFailure,
  AiCapabilityInputMap,
  AiCapabilityKey,
  AiCapabilityOutputMap,
  AiCapabilityResult
} from "./types";
import type { AiCapability } from "./capabilities/capability.interface";

@Injectable()
export class AiService {
  constructor(private readonly capabilityRegistry: CapabilityRegistry) {}

  execute<K extends AiCapabilityKey>(
    capabilityKey: K,
    input: AiCapabilityInputMap[K]
  ): Promise<AiCapabilityResult<AiCapabilityOutputMap[K]> | AiCapabilityFailure> {
    const capability = this.capabilityRegistry.getCapability(capabilityKey) as AiCapability<
      AiCapabilityInputMap[K],
      AiCapabilityOutputMap[K]
    >;

    return capability.execute(input);
  }
}
