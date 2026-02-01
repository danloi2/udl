<script lang="ts">
  import { link } from 'svelte-spa-router';
  import { language, t } from '../stores/language';
  import { ui } from '../stores/ui';
  import { udlData } from '../stores/udlData';
  import { 
    searchResults, 
    searchQuery, 
    selectedPrinciple, 
    selectedGuideline,
    selectedConsideration,
    selectedEducationalLevel,
    selectedCurricularArea,
    selectedType, 
    availableGuidelines,
    availableConsiderations,
    availableEducationalLevels,
    availableCurricularAreas,
    resetFilters 
  } from '../stores/search';
  import LanguageSwitcher from '../components/LanguageSwitcher.svelte';
  import SearchBar from '../components/SearchBar.svelte';
  import Tag from '../components/Tag.svelte';
  import { ArrowLeft, Filter } from 'lucide-svelte';
  import { getGuidelineStyles } from '../utils/colors';
  import LevelBadge from '../components/model/LevelBadge.svelte';
  import type { Language, SearchResult } from '../types';

  let currentLang: Language;
  language.subscribe((value) => {
    currentLang = value;
  });

  // Cascading logic: Reset dependent filters when parent changes
  $: if ($selectedPrinciple) {
    selectedGuideline.set('all');
    selectedConsideration.set('all');
  }

  $: if ($selectedGuideline) {
    selectedConsideration.set('all');
  }

  function getPrincipleForResult(result: SearchResult) {
    return $udlData.networks.find((n) => n.principle.id === result.principleId)?.principle;
  }

  function getDisplayText(result: SearchResult): string {
    if (result.type === 'principle' && 'name' in result.item) {
      return t(result.item.name, currentLang);
    } else if (result.type === 'guideline' && 'name' in result.item) {
      return t(result.item.name, currentLang);
    } else if (result.type === 'consideration' && 'description' in result.item) {
      return t(result.item.description, currentLang);
    }
    return '';
  }

  function getItemLink(result: SearchResult): string {
    if (result.type === 'consideration') {
      return `/item/${result.id}`;
    } else if (result.type === 'guideline') {
      return `/model`;
    } else {
      return `/model`;
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <div class="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between mb-4">
        <a
          href="/"
          use:link
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft class="w-5 h-5" />
          <span>{$ui.home}</span>
        </a>
        <LanguageSwitcher />
      </div>
      <div class="flex justify-center">
        <SearchBar />
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="bg-white border-b border-gray-200 py-4">
    <div class="container mx-auto px-4">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2">
          <Filter class="w-5 h-5 text-gray-600" />
          <span class="text-sm font-medium text-gray-700">{$ui.filters}:</span>
        </div>

        <!-- Principle Filter -->
        <select
          bind:value={$selectedPrinciple}
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{$ui.allPrinciples}</option>
          {#each $udlData.networks as network}
            <option value={network.principle.id}>{t(network.principle.name, currentLang)}</option>
          {/each}
        </select>

        <!-- Guideline Filter (Cascading) -->
        <select
          bind:value={$selectedGuideline}
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{$ui.allGuidelines || 'Todas las pautas'}</option>
          {#each $availableGuidelines as guideline}
            <option value={guideline.id}>{guideline.code}: {t(guideline.name, currentLang)}</option>
          {/each}
        </select>

        <!-- Consideration Filter (Cascading) -->
        <select
          bind:value={$selectedConsideration}
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
        >
          <option value="all">{$ui.allConsiderations || 'Todas las consideraciones'}</option>
          {#each $availableConsiderations as consideration}
            <option value={consideration.id}>{consideration.code}: {t(consideration.description, currentLang).substring(0, 50)}...</option>
          {/each}
        </select>

        <!-- Type Filter -->
        <select
          bind:value={$selectedType}
          class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">{$ui.allTypes}</option>
          <option value="guideline">{$ui.guidelines}</option>
          <option value="consideration">{$ui.considerations}</option>
          <option value="example">{$ui.examples}</option>
        </select>

        {#if $selectedType === 'example' || $selectedType === 'all'}
          <!-- Educational Level Filter -->
          <select
            bind:value={$selectedEducationalLevel}
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{$ui.allEducationalLevels}</option>
            {#each $availableEducationalLevels as level}
              <option value={level.es}>{t(level, currentLang)}</option>
            {/each}
          </select>

          <!-- Curricular Area Filter -->
          <select
            bind:value={$selectedCurricularArea}
            class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{$ui.allCurricularAreas}</option>
            {#each $availableCurricularAreas as area}
              <option value={area.es}>{t(area, currentLang)}</option>
            {/each}
          </select>
        {/if}

        {#if $searchQuery || $selectedPrinciple !== 'all' || $selectedGuideline !== 'all' || $selectedConsideration !== 'all' || $selectedType !== 'all' || $selectedEducationalLevel !== 'all' || $selectedCurricularArea !== 'all'}
          <button
            on:click={resetFilters}
            class="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {$ui.clearFilters}
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Results -->
  <div class="container mx-auto px-4 py-8">
    <div class="mb-4 text-sm text-gray-600">
      {$searchResults.length} {$searchResults.length !== 1 ? $ui.results : $ui.result}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each $searchResults as result}
        {@const principle = getPrincipleForResult(result)}
        {@const guideline = result.type === 'consideration' || result.type === 'guideline' 
          ? $udlData.networks
              .flatMap(n => n.principle.guidelines)
              .find(g => g.id === result.guidelineId || g.code === result.code.split('.')[0])
          : null}
        {@const styles = guideline ? getGuidelineStyles(guideline) : null}
        <a
          href={result.type === 'example' ? `/detail/${result.considerationId}` : `/detail/${result.id}`}
          use:link
          class="block bg-white p-6 rounded-xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 group"
          style="border-top: 4px solid {principle?.color || '#eee'}; {styles?.bgLight || ''}"
        >
          <div class="flex items-start justify-between mb-2">
            {#if result.code}
              <span class="font-mono text-lg font-bold" style="{styles?.text || 'color: #374151'}">
                {result.code}
              </span>
            {:else if result.type === 'example'}
              <div class="flex flex-col gap-1">
                <span class="font-mono text-xs font-black" style="color: {result.item.color}">
                  {result.item.code}
                </span>
                <div class="flex gap-1">
                   <span class="text-[8px] px-1.5 py-0.5 font-black uppercase tracking-wider rounded bg-blue-50 text-blue-600 border border-blue-100">
                    {t(result.educationalLevel, currentLang)}
                  </span>
                  <span class="text-[8px] px-1.5 py-0.5 font-black uppercase tracking-wider rounded bg-purple-50 text-purple-600 border border-purple-100">
                    {t(result.curricularArea, currentLang)}
                  </span>
                </div>
              </div>
            {/if}
            <span class="text-[10px] px-2 py-0.5 font-black uppercase tracking-wider rounded border" 
                  style="background-color: white; border-color: {principle?.color || '#eee'}; color: {principle?.color || '#666'}">
              {#if result.type === 'principle'}
                {$ui.principle || 'Principio'}
              {:else if result.type === 'guideline'}
                {$ui.guideline || 'Pauta'}
              {:else if result.type === 'consideration'}
                {$ui.consideration || 'Consideración'}
              {:else}
                {$ui.examples || 'Ejemplo'}
              {/if}
            </span>
          </div>
          <p class="font-bold mb-3" style="color: {principle?.color || '#111827'}">
            {result.type === 'example' ? t(result.item.activity, currentLang) : getDisplayText(result)}
          </p>
          <div class="flex items-center justify-between mt-3">
            {#if principle?.color}
              <Tag color={principle.color} label={t(principle.name, currentLang)} small={true} />
            {:else if result.type === 'example'}
               <span class="text-[10px] font-bold text-gray-400">ID: {result.considerationId}</span>
            {/if}
            {#if guideline}
              <LevelBadge row={guideline.row} {currentLang} />
            {/if}
          </div>
        </a>
      {/each}
    </div>

    {#if $searchResults.length === 0}
      <div class="text-center py-12">
        <p class="text-gray-500 text-lg">{$ui.noResults}</p>
        <button
          on:click={resetFilters}
          class="mt-4 text-blue-600 hover:text-blue-800 font-medium"
        >
          {$ui.clearFilters}
        </button>
      </div>
    {/if}
  </div>
</div>
