<script lang="ts">
  import type { Guideline } from '../../types';
  import { language, t } from '../../stores/language';
  import { getGuidelineStyles } from '../../utils/colors';
  import ConsiderationItem from './ConsiderationItem.svelte';
  import LevelBadge from './LevelBadge.svelte';
  import type { Language } from '../../types';
  import { getColorStyles } from '../../utils/colors';
  import { showConsiderations } from '../../stores/settings';
  import { slide } from 'svelte/transition';

  export let guideline: Guideline;
  export let principleColor: string = '#ccc';

  let currentLang: Language;
  language.subscribe((value) => {
    currentLang = value;
  });

  import { link } from 'svelte-spa-router';

  $: styles = getColorStyles(principleColor);
</script>

<div class="group bg-white rounded-xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 print:border-gray-200 print:rounded-lg">
  <a href="/detail/{guideline.id}" use:link class="block px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors print:px-2 print:py-1" style="border-top: 4px solid {principleColor}; {styles.bgLight}">
    <div class="flex items-start gap-3 md:gap-4 print:gap-1.5">
      <div 
        class="w-8 h-8 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-lg md:rounded-xl font-mono text-sm md:text-lg font-black shadow-inner print:w-7 print:h-7 print:text-[10pt]" 
        style="background-color: {principleColor}; color: white; text-shadow: 0 1px 1px rgba(0,0,0,0.1)"
      >
        {guideline.code}
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-bold leading-tight">
          {#if guideline.preDescription}
            <span class="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5 pre-description-text">{t(guideline.preDescription, currentLang)}</span>
          {/if}
          <span class="text-xs md:text-base print:text-[10px] print:leading-none" style="color: {principleColor}">{t(guideline.name, currentLang)}</span>
        </h3>
      </div>
    </div>
    <div class="mt-2 md:mt-4 flex justify-end print:hidden">
      <LevelBadge row={guideline.row} {currentLang} />
    </div>
  </a>
  
  {#if $showConsiderations}
    <div class="p-3 space-y-1" transition:slide={{ duration: 300 }}>
      {#each guideline.considerations as consideration}
        <ConsiderationItem {consideration} {guideline} />
      {/each}
    </div>
  {/if}
</div>
