import { api } from '../compartilhado/api.js';

// Falhas no contador ou no armazenamento nunca impedem o login.
export async function registrarVisita() {
    try {
        const chave = 'asr.visita';
        if (sessionStorage.getItem(chave + '.registrada')) return;
        let sessao = sessionStorage.getItem(chave);
        if (!sessao) {
            sessao = crypto.randomUUID();
            sessionStorage.setItem(chave, sessao);
        }
        await api('/visitas', { method: 'POST', publica: true, body: { sessao } });
        sessionStorage.setItem(chave + '.registrada', '1');
    } catch {
        // Uma próxima abertura pode repetir o envio com a mesma chave.
    }
}
