document.querySelector('#tentar').addEventListener('click', () => {

    if (location.pathname === '/app/offline/offline.html') {

        location.assign('/app/login/login.html');

        return;

    }

    location.reload();

});

function atualizarConexao() {

    document.querySelector('#conexao').textContent = navigator.onLine ? 'Rede detectada. Toque em Tentar novamente para acessar o servidor.' : 'Seu dispositivo está sem conexão.';

}

window.addEventListener('online', atualizarConexao);

window.addEventListener('offline', atualizarConexao);

atualizarConexao();
