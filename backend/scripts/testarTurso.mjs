import { spawn } from 'node:child_process';

const processo = spawn(process.execPath, ['--experimental-vm-modules', '--disable-warning=ExperimentalWarning', '--test', 'tests/acesso.test.mjs', 'tests/vendas.test.mjs'], {

    stdio: 'inherit',

    env: { ...process.env, ASR_TESTE_TURSO: '1' },

});

processo.on('error', () => {

    console.error('Não foi possível iniciar os testes do adaptador Turso.');

    process.exitCode = 1;

});

processo.on('exit', codigo => {

    process.exitCode = codigo ?? 1;

});
