import { writable, derived } from 'svelte/store';
import Fuse from 'fuse.js';
import {
  udlData,
  udlIndex,
  getConsiderationForExample,
  getGuidelineForConsideration,
  getPrincipleForGuideline,
} from './udlData';
import { language } from './language';

// Search state
export const searchQuery = writable<string>('');
export const selectedPrinciple = writable<string>('all');
export const selectedGuideline = writable<string>('all');
export const selectedConsideration = writable<string>('all');
export const selectedEducationalLevel = writable<string>('all');
export const selectedCurricularArea = writable<string>('all');
export const selectedType = writable<
  'all' | 'guideline' | 'consideration' | 'example' | 'activity'
>('all');

// Build searchable items
export const searchableItems = derived(
  [udlData, udlIndex, language],
  ([$udlData, $udlIndex, $language]) => {
    const items: any[] = [];

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
        });
      });
    });

    // Add Examples from Index
    $udlIndex.examples.forEach((example) => {
      const consideration = getConsiderationForExample(example.id, $udlIndex);
      const considerationId = consideration ? consideration.id : '';
      let guidelineId = undefined;
      let principleId = undefined;

      if (considerationId) {
        const guideline = getGuidelineForConsideration(considerationId, $udlData);
        if (guideline) {
          guidelineId = guideline.id;
          const principle = getPrincipleForGuideline(guideline.id, $udlData);
          if (principle) principleId = principle.id;
        }
      }

      items.push({
        id: example.id,
        code: example.code,
        type: 'example',
        considerationId: considerationId,
        guidelineId: guidelineId,
        principleId: principleId,
        item: example,
        educationalLevel: example.educationalLevel,
        curricularArea: example.curricularArea,
      });
    });

    // Add Full Activities
    // We only want unique activities (dedupe by ID if we indexed by both ID and Code)
    const uniqueActivities = new Set();
    $udlIndex.activities.forEach((activity) => {
      if (!uniqueActivities.has(activity.id)) {
        uniqueActivities.add(activity.id);
        // Activities don't belong to a specific principle/guideline, so they are top-level or searchable by text
        items.push({
          id: activity.code, // Use code as ID for URL consistency (e.g. 01-PRI-MAT)
          code: activity.code,
          type: 'activity',
          item: activity,
          // meta for filters
          educationalLevel: activity.gradeLevel,
          curricularArea: activity.subject,
        });
      }
    });

    return items;
  }
);

// Fuse.js instance for fuzzy search
export const fuse = derived([searchableItems, language], ([$searchableItems, $language]) => {
  return new Fuse($searchableItems, {
    keys: [
      { name: 'code', weight: 5 },
      { name: 'id', weight: 4 },
      { name: `item.name.${$language}`, weight: 2 },
      { name: `item.description.${$language}`, weight: 1.5 },
      { name: `item.activity.${$language}`, weight: 2 }, // search examples
      { name: `item.title.${$language}`, weight: 3 }, // search activities
      { name: `item.designOptions.${$language}`, weight: 1.5 },
      { name: `item.educationalLevel.${$language}`, weight: 1 },
      { name: `item.curricularArea.${$language}`, weight: 1 },
      { name: 'item.webTools.name', weight: 1 },
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
    .filter((item) => item.type === 'example' || item.type === 'activity')
    .forEach((item: any) => {
      // Assuming multilingual, check ES presence or fallback
      const levelName = item.educationalLevel?.es || 'Unknown';
      levels.set(levelName, item.educationalLevel);
    });
  return Array.from(levels.values());
});

// Unique curricular areas available in examples
export const availableCurricularAreas = derived([searchableItems], ([$searchableItems]) => {
  const areas = new Map();
  $searchableItems
    .filter((item) => item.type === 'example' || item.type === 'activity')
    .forEach((item: any) => {
      const areaName = item.curricularArea?.es || 'Unknown';
      areas.set(areaName, item.curricularArea);
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
        (item) =>
          (item.type === 'example' || item.type === 'activity') &&
          item.educationalLevel?.es === $selectedEducationalLevel
      );
    }

    // Apply curricular area filter
    if ($selectedCurricularArea !== 'all') {
      results = results.filter(
        (item) =>
          (item.type === 'example' || item.type === 'activity') &&
          item.curricularArea?.es === $selectedCurricularArea
      );
    }

    // Apply type filter
    if ($selectedType !== 'all') {
      results = results.filter((item) => item.type === $selectedType);
    }

    // Secondary sort: prioritize 'activity' type above 'example' for similar scores
    // And ensure principles > guidelines > considerations > activities > examples for general navigation
    const typeOrder: Record<string, number> = {
      principle: 1,
      guideline: 2,
      consideration: 3,
      activity: 4,
      example: 5,
    };

    // Apply search query
    if ($searchQuery.trim()) {
      const fuseResults = $fuse.search($searchQuery);
      // Keep Fuse.js score but use type as tie-breaker
      results = fuseResults
        .sort((a, b) => {
          if (Math.abs(a.score! - b.score!) < 0.001) {
            return (
              (typeOrder[a.item.type as string] || 99) - (typeOrder[b.item.type as string] || 99)
            );
          }
          return a.score! - b.score!;
        })
        .map((result) => result.item);
    } else {
      // Default sort when no query
      results = [...results].sort((a, b) => {
        return (typeOrder[a.type as string] || 99) - (typeOrder[b.type as string] || 99);
      });
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
