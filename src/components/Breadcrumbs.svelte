<script lang="ts">
  import { ChevronRight } from 'lucide-svelte';
  import { link } from 'svelte-spa-router';

  export let items: { label: string; href?: string; icon?: any }[] = [];
  export let color: string | undefined = undefined;
</script>

<nav class="flex items-center space-x-2 text-sm text-gray-600" style={color ? `color: ${color}` : ''}>
  {#each items as item, i}
    {#if i > 0}
      <ChevronRight class="w-4 h-4 opacity-50" />
    {/if}
    {#if item.href}
      <a href={item.href} use:link class="hover:text-gray-900 transition-colors flex items-center gap-1" style={color ? `color: ${color}` : ''}>
        {#if item.icon}
          <svelte:component this={item.icon} class="w-4 h-4" />
        {/if}
        {#if item.label}
          {item.label}
        {/if}
      </a>
    {:else}
      <span class="font-medium flex items-center gap-1" style={color ? `color: ${color}` : ''}>
        {#if item.icon}
          <svelte:component this={item.icon} class="w-4 h-4" />
        {/if}
        {#if item.label}
          {item.label}
        {/if}
      </span>
    {/if}
  {/each}
</nav>
