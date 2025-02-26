import esbuild from 'esbuild'
import {copy} from 'esbuild-plugin-copy'

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  outdir: 'dist',
  target: ['chrome58', 'firefox57', 'safari11'], //support edge?
  plugins: [
    copy({
      assets: {
        from: ['src/*.html'],
        to: ['.'],
      },
    }),
  ],
})
