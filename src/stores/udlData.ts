import { writable, derived } from 'svelte/store';
import type {
  UDLRoot,
  UDLData,
  UDLIndex,
  Network,
  Principle,
  Guideline,
  Consideration,
  Example,
} from '../types';
import udlJson from '../data/udl-core.json';

// Load and parse UDL data
const rawData = udlJson as UDLRoot;
export const udlData = writable<UDLData>(rawData.udl);

import g1 from '../data/udl-guideline-1.json';
import g2 from '../data/udl-guideline-2.json';
import g3 from '../data/udl-guideline-3.json';
import g4 from '../data/udl-guideline-4.json';
import g5 from '../data/udl-guideline-5.json';
import g6 from '../data/udl-guideline-6.json';
import g7 from '../data/udl-guideline-7.json';
import g8 from '../data/udl-guideline-8.json';
import g9 from '../data/udl-guideline-9.json';

const allExamplesFiles = [g1, g2, g3, g4, g5, g6, g7, g8, g9];

// Create indexed data for fast lookups
export const udlIndex = derived(udlData, ($udlData) => {
  const index: UDLIndex = {
    networks: new Map(),
    principles: new Map(),
    guidelines: new Map(),
    considerations: new Map(),
    examples: new Map(),
  };

  $udlData.networks.forEach((network: Network) => {
    index.networks.set(network.id, network);

    const principle = network.principle;
    index.principles.set(principle.id, principle);

    principle.guidelines.forEach((guideline: Guideline) => {
      index.guidelines.set(guideline.id, guideline);

      guideline.considerations.forEach((consideration: Consideration) => {
        index.considerations.set(consideration.id, consideration);
      });
    });
  });

  // Index examples
  allExamplesFiles.forEach((gFile: any) => {
    gFile.considerations.forEach((cGroup: any) => {
      cGroup.examples.forEach((example: any) => {
        index.examples.set(example.id, example as Example);
      });
    });
  });

  return index;
});

// Helper functions
export function getNetworkById(id: string, index: UDLIndex): Network | undefined {
  return index.networks.get(id);
}

export function getPrincipleById(id: string, index: UDLIndex): Principle | undefined {
  return index.principles.get(id);
}

export function getGuidelineById(id: string, index: UDLIndex): Guideline | undefined {
  return index.guidelines.get(id);
}

export function getConsiderationById(id: string, index: UDLIndex): Consideration | undefined {
  return index.considerations.get(id);
}

// Get network for a principle
export function getNetworkForPrinciple(principleId: string, data: UDLData): Network | undefined {
  return data.networks.find((n: Network) => n.principle.id === principleId);
}

// Get principle for a guideline
export function getPrincipleForGuideline(
  guidelineId: string,
  data: UDLData
): Principle | undefined {
  for (const network of data.networks) {
    if (network.principle.guidelines.some((g: Guideline) => g.id === guidelineId)) {
      return network.principle;
    }
  }
  return undefined;
}

// Get guideline for a consideration
export function getGuidelineForConsideration(
  considerationId: string,
  data: UDLData
): Guideline | undefined {
  for (const network of data.networks) {
    for (const guideline of network.principle.guidelines) {
      if (guideline.considerations.some((c: Consideration) => c.id === considerationId)) {
        return guideline;
      }
    }
  }
  return undefined;
}

export function getExampleById(id: string, index: UDLIndex): Example | undefined {
  return index.examples.get(id);
}

// Get consideration for an example
export function getConsiderationForExample(
  exampleId: string,
  index: UDLIndex
): Consideration | undefined {
  // Extract considerationId from exampleId (e.g., "1-1-1" -> "1-1")
  const parts = exampleId.split('-');
  if (parts.length >= 2) {
    const considerationId = `${parts[0]}-${parts[1]}`;
    return index.considerations.get(considerationId);
  }
  return undefined;
}

// Get principle for a consideration
export function getPrincipleForConsideration(
  considerationId: string,
  data: UDLData
): Principle | undefined {
  const guideline = getGuidelineForConsideration(considerationId, data);
  if (guideline) {
    return getPrincipleForGuideline(guideline.id, data);
  }
  return undefined;
}

// Get network for a guideline
export function getNetworkForGuideline(guidelineId: string, data: UDLData): Network | undefined {
  return data.networks.find((n: Network) =>
    n.principle.guidelines.some((g: Guideline) => g.id === guidelineId)
  );
}

// Get network for a consideration
export function getNetworkForConsideration(
  considerationId: string,
  data: UDLData
): Network | undefined {
  const guideline = getGuidelineForConsideration(considerationId, data);
  if (guideline) {
    return getNetworkForGuideline(guideline.id, data);
  }
  return undefined;
}
