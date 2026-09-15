import { cp, mkdir, readdir } from 'node:fs/promises';

import { fileURLToPath } from 'node:url';

import path from 'node:path';

const origem = fileURLToPath(new URL('../../frontend/', import.meta.url));

const destino = fileURLToPath(new URL('../public/app/', import.meta.url));

// Copia somente arquivos públicos conhecidos; .env, banco e backend não entram.
const permitidos = new Set(['.html', '.css', '.js', '.svg', '.png', '.webmanifest']);

async function copiar(diretorio, saida) {

    await mkdir(saida, { recursive: true });

    for (const entrada of await readdir(diretorio, { withFileTypes: true })) {

        if (entrada.name.startsWith('.')) continue;

        const arquivo = path.join(diretorio, entrada.name);

        const alvo = path.join(saida, entrada.name);

        if (entrada.isDirectory()) {

            await copiar(arquivo, alvo);

        } else if (entrada.isFile() && permitidos.has(path.extname(entrada.name))) {

            await cp(arquivo, alvo);

        }

    }

}

await copiar(origem, destino);

console.log('Frontend preparado em public/app para a Vercel.');
