import esbuild from 'esbuild'
import {copy} from 'esbuild-plugin-copy'
import http from 'node:http'

esbuild.build({
  entryPoints: ['src/hotReload.ts'],
  bundle: true,
  minify: true,
  outdir: 'dist',
  target: ['chrome58', 'firefox57', 'safari11'],
})

// https://esbuild.github.io/api/#overview
let context = await esbuild.context({
  entryPoints: ['src/index.ts'],
  bundle: true,
  minify: true,
  outdir: 'dist',
  format: 'iife',
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

// https://esbuild.github.io/api/#live-reload
await context.watch()

const {host, port} = await context.serve({
  servedir: 'dist',
})

// https://esbuild.github.io/api/#serve-proxy
http
  .createServer((request, response) => {
    const options = {
      hostname: host,
      port: port,
      path: request.url,
      method: request.method,
      headers: request.headers,
    }

    // Forward each incoming request to esbuild
    const esbuildServerRequest = http.request(options, (esbuildServerResponse) => {
      // https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction
      // writeHead from esbuildServer to client

      // if content type is html add code snippet
      let modifiedBody = []
      if (esbuildServerResponse.headers['content-type']?.startsWith('text/html')) {
        esbuildServerResponse
          .on('data', (chunk) => {
            modifiedBody.push(chunk)
          })
          .on('end', () => {
            modifiedBody = Buffer.concat(modifiedBody).toString()
            // https://esbuild.github.io/api/#hot-reloading-css
            const hotReloadCssSnippet = Buffer.from(
              '  <script src="/hotReload.js"></script>\n  </body>'
            ).toString('utf8')

            // modifiedBody =
            //   modifiedBody.substring(0, modifiedBody.indexOf('</body>')) + hotReloadCssSnippet
            modifiedBody = modifiedBody.replace('</body>', hotReloadCssSnippet)
            // end response to client
            response.end(modifiedBody)
          })
      } else {
        response.writeHead(esbuildServerResponse.statusCode, esbuildServerResponse.headers)
        esbuildServerResponse.pipe(response, {end: true})
        // end response to client
      }
    })

    // Forward the body of the request to esbuild dev server
    request.pipe(esbuildServerRequest, {end: true})
  })
  .listen(3001)

console.log(`Dev Server listening on http://${host}:3001`)
