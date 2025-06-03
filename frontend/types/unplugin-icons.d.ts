declare module 'unplugin-icons/vite' {
  interface IconsOptions {
    compiler?: 'vue2' | 'vue3' | 'jsx' | 'solid' | 'svelte';
    jsx?: 'react' | 'preact' | 'solid';
    autoInstall?: boolean;
    scale?: number;
    defaultClass?: string;
  }
  
  function Icons(options?: IconsOptions): any;
  export default Icons;
} 