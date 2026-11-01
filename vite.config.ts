import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Build at the domain root for ordinary hosting, or at /Starwish/ for Pages.
export default defineConfig(()=>{
 const base=process.env.GITHUB_PAGES==='true'?'/Starwish/':'/';
 return {base,plugins:[{
  name:'starwish-pages-paths',enforce:'pre',
  transform(code,id){
   if(base==='/'||!/[\\/]src[\\/].*\.(ts|tsx)$/.test(id))return;
   return code
    .replace(/(['"`])\/(?=(?:assets|audio|fonts|wardrobe-package)\/)/g,(_,quote)=>quote+base)
    .replace(/(['"`])\/\?/g,(_,quote)=>quote+base+'?')
    .replace(/href=(["'])\/\1/g,`href="${base}"`)
    .replace(/location\.assign\((["'])\/\1\)/g,`location.assign("${base}")`);
  }
 },react()]};
});
