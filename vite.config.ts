import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const plugins = [react()];

  // Only use basicSsl in development
  if (command === 'serve') {
    // @ts-expect-error Plugin type mismatch in safe mode
    plugins.push(basicSsl());
  }

  return {
    plugins,
    server: {
      host: true,
    }
  };
})
