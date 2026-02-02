<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { link } from 'svelte-spa-router';
  import { fade } from 'svelte/transition';
  import questions from '../data/json/home-questions.json';
  import { ArrowRight } from 'lucide-svelte';
  import { language, t } from '../stores/language';
  import { ui } from '../stores/ui';
  import { udlData } from '../stores/udlData';
  import type { Language } from '../types';
  import LanguageSwitcher from '../components/LanguageSwitcher.svelte';

  let currentLang: Language;
  let displayedText = "";
  let currentQuestionIndex = -1;
  let isTyping = false;
  let cursorVisible = true;
  let timeoutId: any;
  let cursorInterval: any;

  // Reactively derive themes from udl-core.json data
  $: themeMap = $udlData.networks.reduce((acc, network) => {
    const pId = network.principle.id;
    acc[pId] = { color: network.color || '#000000' };
    return acc;
  }, {} as Record<string, { color: string }>);

  // Fallback/Initial theme
  let currentTheme = { color: '#078743' };

  language.subscribe((value) => {
    if (currentLang !== value && !isTyping && currentQuestionIndex !== -1) {
       displayedText = t(questions[currentQuestionIndex], value);
    }
    currentLang = value;
  });

  function getRandomQuestionIndex() {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * questions.length);
    } while (newIndex === currentQuestionIndex && questions.length > 1);
    return newIndex;
  }

  async function typeWriterLoop() {
    currentQuestionIndex = getRandomQuestionIndex();
    
    const question = questions[currentQuestionIndex];
    if (question.principle && themeMap[question.principle]) {
      currentTheme = themeMap[question.principle];
    }
    
    const fullText = t(question, currentLang);
    isTyping = true;
    displayedText = "";

    for (let i = 0; i < fullText.length; i++) {
      displayedText += fullText[i];
      await new Promise(r => timeoutId = setTimeout(r, 20 + Math.random() * 30)); 
    }

    isTyping = false;
    await new Promise(r => timeoutId = setTimeout(r, 4500));

    isTyping = true;
    while (displayedText.length > 0) {
      displayedText = displayedText.slice(0, -1);
      await new Promise(r => timeoutId = setTimeout(r, 10));
    }
    isTyping = false;
    await new Promise(r => timeoutId = setTimeout(r, 600));
    
    typeWriterLoop();
  }

  onMount(() => {
    cursorInterval = setInterval(() => {
      cursorVisible = !cursorVisible;
    }, 530);
    typeWriterLoop();
  });

  onDestroy(() => {
    clearTimeout(timeoutId);
    clearInterval(cursorInterval);
  });
</script>

<div 
  class="min-h-screen flex flex-col relative overflow-hidden transition-colors duration-1000 theme-bg-gradient"
  style="--theme-color: {currentTheme.color}; --theme-color-5: {currentTheme.color}0D; --theme-color-10: {currentTheme.color}1A;"
>
  
  <div class="absolute top-0 left-0 w-full p-6 z-50 flex justify-end">
    <LanguageSwitcher />
  </div>

  <div class="flex-1 flex flex-col items-center justify-center container mx-auto px-6 max-w-5xl relative z-10">
    
    <div class="min-h-[300px] flex items-center justify-center">
      <h1 class="text-3xl md:text-5xl md:leading-tight font-black text-gray-800 tracking-tight drop-shadow-xs text-center">
        {displayedText}<span class="theme-caret inline-block w-[3px] md:w-[5px] h-[30px] md:h-[48px] ml-1 align-middle {cursorVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100"></span>
      </h1>
    </div>

    <div class="mt-20 flex justify-center fade-in">
      <a 
        href="/model" 
        use:link
        class="group relative inline-flex items-center gap-3 px-8 py-4 text-white text-lg font-bold rounded-full shadow-lg hover:shadow-2xl hover:brightness-110 hover:-translate-y-1 transition-all duration-300 theme-button"
      >
        <span>{$ui.readyToTeach}</span>
        <ArrowRight class="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        <div class="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </a>
    </div>

  </div>

  <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
    <div class="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/30 blur-3xl mix-blend-overlay animate-pulse"></div>
    <div class="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-white/20 blur-3xl mix-blend-overlay"></div>
  </div>

</div>

<style>
  .theme-bg-gradient {
    background-image: linear-gradient(to bottom right, var(--theme-color-5), var(--theme-color-10), var(--theme-color-5));
  }
  .theme-button {
    background-color: var(--theme-color);
  }
  .theme-caret {
    background-color: var(--theme-color);
  }
  .fade-in {
    animation: fadeIn 1s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
