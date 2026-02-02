<script lang="ts">
  import { link } from 'svelte-spa-router';
  import { ui } from '../stores/ui';
  import { showConsiderations } from '../stores/settings';
  import { ArrowLeft, LayoutGrid, Search, Eye, EyeOff, Home } from 'lucide-svelte';
  import PrintPDFButton from './PrintPDFButton.svelte';

  export let currentPage: 'model' | 'explorer' | 'detail';

  // Common button classes
  const btnClass = "flex flex-col items-center justify-center w-16 h-16 rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 relative group";
  const primaryClass = "bg-blue-600 text-white";
  const secondaryClass = "bg-white text-blue-600 border border-blue-100";
  const tooltipClass = "absolute right-full mr-4 px-3 py-1.5 bg-gray-900/80 backdrop-blur text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none";
</script>

<div class="fixed bottom-8 right-8 z-50 flex flex-col gap-4 print:hidden">
  
  <!-- Home Button (Always visible) -->
  <a
    href="/"
    use:link
    class="{btnClass} {secondaryClass}"
    title={$ui.home}
  >
    <Home class="w-6 h-6 mb-1" />
    <span class="text-[10px] font-black uppercase tracking-widest">{$ui.home}</span>
    <span class="{tooltipClass}">{$ui.home}</span>
  </a>

  <!-- Model Button (Visible if not on Model page) -->
  {#if currentPage !== 'model'}
    <a
      href="/model"
      use:link
      class="{btnClass} {secondaryClass}"
      title={$ui.modelAction}
    >
      <LayoutGrid class="w-6 h-6 mb-1" />
      <span class="text-[10px] font-black uppercase tracking-widest">{$ui.modelAction}</span>
      <span class="{tooltipClass}">{$ui.modelAction}</span>
    </a>
  {/if}

  <!-- Search Button (Visible if not on Explorer page) -->
  {#if currentPage !== 'explorer'}
    <a
      href="/explore"
      use:link
      class="{btnClass} {secondaryClass}"
      title={$ui.searchAction}
    >
      <Search class="w-6 h-6 mb-1" />
      <span class="text-[10px] font-black uppercase tracking-widest">{$ui.searchAction}</span>
      <span class="{tooltipClass}">{$ui.searchAction}</span>
    </a>
  {/if}

  <!-- Show/Hide Considerations (Only on Model page) -->
  {#if currentPage === 'model'}
    <button
      on:click={() => showConsiderations.update(v => !v)}
      class="{btnClass} {primaryClass}"
      title={$showConsiderations ? $ui.hideConsiderations : $ui.showConsiderations}
    >
      {#if $showConsiderations}
        <EyeOff class="w-6 h-6 mb-1" />
        <span class="text-[10px] font-black uppercase tracking-widest">{$ui.hideAction}</span>
      {:else}
        <Eye class="w-6 h-6 mb-1" />
        <span class="text-[10px] font-black uppercase tracking-widest">{$ui.showAction}</span>
      {/if}
      <span class="{tooltipClass}">
        {$showConsiderations ? $ui.hideConsiderations : $ui.showConsiderations}
      </span>
    </button>
  {/if}

  <!-- PDF Button (Always visible) -->
  <PrintPDFButton />
</div>
