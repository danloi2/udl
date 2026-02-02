<script lang="ts">
  import { Printer } from 'lucide-svelte';
  
  function handlePrint() {
    window.print();
  }
  export let className = "";
</script>

<button
  on:click={handlePrint}
  class="flex flex-col items-center justify-center w-16 h-16 bg-gray-800 text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 print:hidden {className}"
  title="Imprimir PDF / Print to PDF"
>
  <Printer class="w-6 h-6 mb-1" />
  <span class="text-[10px] font-black uppercase tracking-widest">PDF</span>
</button>
