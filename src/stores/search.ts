import { writable, derived } from 'svelte/store';
import Fuse from 'fuse.js';
import { udlData } from './udlData';
import { language } from './language';
import g1 from '../data/udl-guideline-1.json';
import g2 from '../data/udl-guideline-2.json';
import g3 from '../data/udl-guideline-3.json';
import g4 from '../data/udl-guideline-4.json';
import g5 from '../data/udl-guideline-5.json';
import g6 from '../data/udl-guideline-6.json';
import g7 from '../data/udl-guideline-7.json';
import g8 from '../data/udl-guideline-8.json';
import g9 from '../data/udl-guideline-9.json';

const allExamplesData = [g1, g2, g3, g4, g5, g6, g7, g8, g9];

// Search state
export const searchQuery = writable<string>('');
export const selectedPrinciple = writable<string>('all');
export const selectedGuideline = writable<string>('all');
export const selectedConsideration = writable<string>('all');
export const selectedEducationalLevel = writable<string>('all');
export const selectedCurricularArea = writable<string>('all');
export const selectedType = writable<'all' | 'guideline' | 'consideration' | 'example'>('all');

// Build searchable items
export const searchableItems = derived([udlData, language], ([$udlData, $language]) => {
  const items: any[] = [];
  const considerationToPrinciple = new Map<string, string>();

  $udlData.networks.forEach((network) => {
    const principle = network.principle;
    // Add principle
    items.push({
      id: principle.id,
      code: '',
      type: 'principle',
      principleId: principle.id,
      item: principle,
    });

    principle.guidelines.forEach((guideline) => {
      // Add guideline
      items.push({
        id: guideline.id,
        code: guideline.code,
        type: 'guideline',
        principleId: principle.id,
        guidelineId: guideline.id,
        item: guideline,
        principleName: principle.name,
      });

      guideline.considerations.forEach((consideration) => {
        // Add consideration
        items.push({
          id: consideration.id,
          code: consideration.code,
          type: 'consideration',
          principleId: principle.id,
          guidelineId: guideline.id,
          item: consideration,
          principleName: principle.name,
          guidelineName: guideline.name,
        });

        // Map consideration to principle
        considerationToPrinciple.set(consideration.id, principle.id);
      });
    });
  });

  // Add Examples
  allExamplesData.forEach((gFile: any) => {
    gFile.considerations.forEach((cGroup: any) => {
      cGroup.examples.forEach((example: any) => {
        items.push({
          id: example.id,
          code: '',
          type: 'example',
          considerationId: cGroup.considerationId,
          principleId: considerationToPrinciple.get(cGroup.considerationId),
          item: example,
          educationalLevel: example.educationalLevel,
          curricularArea: example.curricularArea,
        });
      });
    });
  });

  return items;
});

// Fuse.js instance for fuzzy search
export const fuse = derived([searchableItems, language], ([$searchableItems, $language]) => {
  return new Fuse($searchableItems, {
    keys: [
      { name: 'code', weight: 4 },
      { name: `item.name.${$language}`, weight: 2 },
      { name: `item.description.${$language}`, weight: 1.5 },
      { name: `item.activity.${$language}`, weight: 1.5 },
      { name: `item.designOptions.${$language}`, weight: 1.0 },
      { name: `principleName.${$language}`, weight: 0.8 },
      { name: `guidelineName.${$language}`, weight: 0.8 },
    ],
    threshold: 0.4,
    location: 0,
    distance: 1000,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
});

// Available guidelines based on selected principle
export const availableGuidelines = derived(
  [udlData, selectedPrinciple],
  ([$udlData, $selectedPrinciple]) => {
    if ($selectedPrinciple === 'all') {
      return $udlData.networks.flatMap((n) => n.principle.guidelines);
    } else {
      const network = $udlData.networks.find((n) => n.principle.id === $selectedPrinciple);
      return network ? network.principle.guidelines : [];
    }
  }
);

// Available considerations based on selected principle and guideline
export const availableConsiderations = derived(
  [udlData, selectedPrinciple, selectedGuideline],
  ([$udlData, $selectedPrinciple, $selectedGuideline]) => {
    let guidelines = [];
    if ($selectedPrinciple === 'all') {
      guidelines = $udlData.networks.flatMap((n) => n.principle.guidelines);
    } else {
      const network = $udlData.networks.find((n) => n.principle.id === $selectedPrinciple);
      guidelines = network ? network.principle.guidelines : [];
    }
    if ($selectedGuideline !== 'all') {
      guidelines = guidelines.filter((g) => g.id === $selectedGuideline);
    }
    return guidelines.flatMap((g) => g.considerations);
  }
);

// Unique educational levels available in examples
export const availableEducationalLevels = derived([searchableItems], ([$searchableItems]) => {
  const levels = new Map();
  $searchableItems
    .filter((item) => item.type === 'example')
    .forEach((item: any) => {
      levels.set(item.educationalLevel.es, item.educationalLevel);
    });
  return Array.from(levels.values());
});

// Unique curricular areas available in examples
export const availableCurricularAreas = derived([searchableItems], ([$searchableItems]) => {
  const areas = new Map();
  $searchableItems
    .filter((item) => item.type === 'example')
    .forEach((item: any) => {
      areas.set(item.curricularArea.es, item.curricularArea);
    });
  return Array.from(areas.values());
});

// Filtered and searched results
export const searchResults = derived(
  [
    searchableItems,
    searchQuery,
    selectedPrinciple,
    selectedGuideline,
    selectedConsideration,
    selectedEducationalLevel,
    selectedCurricularArea,
    selectedType,
    fuse,
  ],
  ([
    $searchableItems,
    $searchQuery,
    $selectedPrinciple,
    $selectedGuideline,
    $selectedConsideration,
    $selectedEducationalLevel,
    $selectedCurricularArea,
    $selectedType,
    $fuse,
  ]) => {
    let results = $searchableItems;

    // Apply search query
    if ($searchQuery.trim()) {
      const fuseResults = $fuse.search($searchQuery);
      results = fuseResults.map((result) => result.item);
    }

    // Apply principle filter
    if ($selectedPrinciple !== 'all') {
      results = results.filter((item) => item.principleId === $selectedPrinciple);
    }

    // Apply guideline filter
    if ($selectedGuideline !== 'all') {
      results = results.filter((item) => item.guidelineId === $selectedGuideline);
    }

    // Apply consideration filter
    if ($selectedConsideration !== 'all') {
      results = results.filter(
        (item) =>
          item.id === $selectedConsideration || item.considerationId === $selectedConsideration
      );
    }

    // Apply educational level filter
    if ($selectedEducationalLevel !== 'all') {
      results = results.filter(
        (item) => item.type === 'example' && item.educationalLevel?.es === $selectedEducationalLevel
      );
    }

    // Apply curricular area filter
    if ($selectedCurricularArea !== 'all') {
      results = results.filter(
        (item) => item.type === 'example' && item.curricularArea?.es === $selectedCurricularArea
      );
    }

    // Apply type filter
    if ($selectedType !== 'all') {
      results = results.filter((item) => item.type === $selectedType);
    }

    return results;
  }
);

// Reset filters
export function resetFilters() {
  searchQuery.set('');
  selectedPrinciple.set('all');
  selectedGuideline.set('all');
  selectedConsideration.set('all');
  selectedEducationalLevel.set('all');
  selectedCurricularArea.set('all');
  selectedType.set('all');
}
