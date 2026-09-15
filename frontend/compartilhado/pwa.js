let conviteInstalacao;

let atualizarAoAtivar = false;

const ferramentas = document.createElement('section');

ferramentas.className = 'pwa-ferramentas';

ferramentas.setAttribute('aria-label', 'Aplicativo');

ferramentas.innerHTML = '<button type="button" data-instalar>Instalar app</button><button type="button" data-atualizar hidden>Atualização disponível</button><p role="status" hidden></p>';

(document.querySelector('.acesso-caixa') || document.querySelector('main') || document.body).prepend(ferramentas);

const instalar = ferramentas.querySelector('[data-instalar]');

const atualizar = ferramentas.querySelector('[data-atualizar]');

const aviso = ferramentas.querySelector('[role="status"]');

const modoAplicativo = window.matchMedia('(display-mode: standalone)');

function atualizarModo() {

    instalar.hidden = modoAplicativo.matches || navigator.standalone === true;

}

function atualizarConexao() {

    aviso.hidden = navigator.onLine;

    aviso.textContent = navigator.onLine ? '' : 'Sem conexão. Reconecte para consultar ou salvar dados.';

}

window.addEventListener('beforeinstallprompt', evento => {

    evento.preventDefault();

    conviteInstalacao = evento;

    atualizarModo();

});

window.addEventListener('appinstalled', () => {

    conviteInstalacao = null;

    instalar.hidden = true;

});

instalar.addEventListener('click', async () => {

    if (conviteInstalacao) {

        const convite = conviteInstalacao;

        conviteInstalacao = null;

        instalar.disabled = true;

        try {

            await convite.prompt();

            const escolha = await convite.userChoice;

            if (escolha.outcome === 'accepted') instalar.hidden = true;

        } catch {

            aviso.hidden = false;

            aviso.textContent = 'A instalação não foi concluída. Tente novamente pelo menu do navegador.';

        } finally {

            instalar.disabled = false;

        }

        return;

    }

    const dialogo = document.createElement('dialog');

    dialogo.className = 'pwa-dialogo';

    dialogo.setAttribute('aria-label', 'Instalar ASR Systems');

    dialogo.innerHTML = '<h2>Instalar ASR Systems</h2><p>No Android ou computador, procure Instalar aplicativo no menu do navegador. No iPhone ou iPad, abra no Safari e use Compartilhar → Adicionar à Tela de Início.</p><p>A opção depende do navegador. Se não aparecer, continue usando o sistema por esta página.</p><form method="dialog"><button autofocus>Entendi</button></form>';

    document.body.append(dialogo);

    dialogo.addEventListener('close', () => dialogo.remove());

    dialogo.showModal();

});

window.addEventListener('online', atualizarConexao);

window.addEventListener('offline', atualizarConexao);

modoAplicativo.addEventListener('change', atualizarModo);

atualizarModo();

atualizarConexao();

if ('serviceWorker' in navigator && window.isSecureContext) {

    navigator.serviceWorker.addEventListener('controllerchange', () => {

        if (atualizarAoAtivar) location.reload();

    });

    navigator.serviceWorker.register('/app/service-worker.js', { scope: '/app/', updateViaCache: 'none' }).then(registro => {

        function mostrarAtualizacao() {

            atualizar.hidden = !registro.waiting || !navigator.serviceWorker.controller;

        }

        mostrarAtualizacao();

        registro.addEventListener('updatefound', () => {

            registro.installing?.addEventListener('statechange', mostrarAtualizacao);

        });

        atualizar.addEventListener('click', () => {

            if (!registro.waiting || !window.confirm('A página será recarregada. Salve seu trabalho antes de atualizar. Continuar?')) return;

            atualizarAoAtivar = true;

            registro.waiting.postMessage({ tipo: 'ATUALIZAR' });

        });

    }).catch(() => {

        aviso.hidden = false;

        aviso.textContent = 'Não foi possível preparar o aplicativo para instalação. Tente recarregar a página quando estiver conectado.';

    });

}
