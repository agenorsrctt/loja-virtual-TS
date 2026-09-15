import { montarCadastro } from '../compartilhado/cadastros.js';

import { erroTela } from '../compartilhado/interface.js';

montarCadastro('usuarios').catch(erroTela);
