// ===================================
// JAVASCRIPT FRONTEND - TUTORIAL SUPABASE
// ===================================
// Este arquivo contém toda a lógica do frontend
// Aqui fazemos a comunicação com a API backend

// 1. CONFIGURAÇÕES GLOBAIS
const API_BASE_URL = 'http://localhost:3000/api';

// Variáveis globais
let produtos = [];
let produtoParaExcluir = null;

// 2. ELEMENTOS DO DOM
const elementos = {
    formProduto: document.getElementById('form-produto'),
    inputNome: document.getElementById('nome'),
    inputPreco: document.getElementById('preco'),
    inputDescricao: document.getElementById('descricao'),
    btnCadastrar: document.getElementById('btn-cadastrar'),
    btnTexto: document.getElementById('btn-texto'),
    btnLoading: document.getElementById('btn-loading'),

    gridProdutos: document.getElementById('grid-produtos'),
    listaVazia: document.getElementById('lista-vazia'),
    loadingProdutos: document.getElementById('loading-produtos'),
    contadorProdutos: document.getElementById('contador-produtos'),
    totalProdutos: document.getElementById('total-produtos'),
    btnAtualizar: document.getElementById('btn-atualizar'),

    statusConexao: document.getElementById('status-conexao'),
    statusIcon: document.getElementById('status-icon'),
    statusTexto: document.getElementById('status-texto'),

    modalConfirmacao: document.getElementById('modal-confirmacao'),
    produtoNome: document.getElementById('produto-nome'),
    btnCancelar: document.getElementById('btn-cancelar'),
    btnConfirmar: document.getElementById('btn-confirmar'),

    notificacoes: document.getElementById('notificacoes')
};

// 3. FUNÇÕES UTILITÁRIAS
function mostrarNotificacao(mensagem, tipo = 'info', duracao = 5000) {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo} p-4 rounded-lg shadow-lg animate-slideIn`;

    const icones = { sucesso: '✅', erro: '❌', info: 'ℹ️' };

    notificacao.innerHTML = `
        <div class="flex items-center space-x-3">
            <span class="text-xl">${icones[tipo]}</span>
            <span class="font-medium">${mensagem}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-white hover:text-gray-200">
                ✕
            </button>
        </div>
    `;

    elementos.notificacoes.appendChild(notificacao);

    setTimeout(() => {
        if (notificacao.parentElement) notificacao.remove();
    }, duracao);
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function atualizarStatusConexao(status, mensagem) {
    elementos.statusConexao.className = `mb-6 p-4 rounded-lg border status-${status}`;
    elementos.statusConexao.classList.remove('hidden');

    const icones = { online: '✅', offline: '❌', loading: '⏳' };
    elementos.statusIcon.textContent = icones[status];
    elementos.statusTexto.textContent = mensagem;
}

// 4. FUNÇÕES DE API
async function testarConexao() {
    try {
        atualizarStatusConexao('loading', 'Verificando conexão com a API...');
        const response = await fetch(`${API_BASE_URL}/test`);
        const data = await response.json();

        if (data.success) {
            atualizarStatusConexao('online', 'Conectado com sucesso à API!');
            setTimeout(() => elementos.statusConexao.classList.add('hidden'), 3000);
        } else {
            throw new Error('API retornou erro');
        }
    } catch (error) {
        console.error('Erro ao testar conexão:', error);
        atualizarStatusConexao('offline', 'Erro de conexão. Verifique se o backend está rodando.');
        mostrarNotificacao('Erro de conexão com a API. Verifique se o backend está rodando na porta 3000.', 'erro');
    }
}

async function buscarProdutos() {
    try {
        console.log('🔍 Buscando produtos...');
        elementos.loadingProdutos.classList.remove('hidden');
        elementos.gridProdutos.classList.add('hidden');
        elementos.listaVazia.classList.add('hidden');

        const response = await fetch(`${API_BASE_URL}/produtos`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Erro ao buscar produtos');
        produtos = data.data || [];
        console.log(`✅ ${produtos.length} produtos encontrados`);
        renderizarProdutos();
    } catch (error) {
        console.error('❌ Erro ao buscar produtos:', error);
        mostrarNotificacao(`Erro ao carregar produtos: ${error.message}`, 'erro');
        elementos.loadingProdutos.classList.add('hidden');
        elementos.listaVazia.classList.remove('hidden');
    }
}

async function cadastrarProduto(dadosProduto) {
    try {
        console.log('➕ Cadastrando produto:', dadosProduto);
        const response = await fetch(`${API_BASE_URL}/produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosProduto)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Erro ao cadastrar produto');

        console.log('✅ Produto cadastrado:', data.data);
        mostrarNotificacao('Produto cadastrado com sucesso!', 'sucesso');
        elementos.formProduto.reset();
        await buscarProdutos();
    } catch (error) {
        console.error('❌ Erro ao cadastrar produto:', error);
        mostrarNotificacao(`Erro ao cadastrar produto: ${error.message}`, 'erro');
    }
}

async function excluirProduto(id) {
    try {
        if (!id || isNaN(id) || id <= 0) throw new Error('ID do produto inválido');
        const produtoId = parseInt(id, 10);

        // Pega o produto local antes de excluir (para garantir o nome)
        const produtoLocal = produtos.find(p => p.id === produtoId);
        const nomeLocal = produtoLocal ? produtoLocal.nome : 'sem nome';

        console.log('🗑️ Excluindo produto ID:', produtoId);
        const response = await fetch(`${API_BASE_URL}/produtos/${produtoId}`, { method: 'DELETE' });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Erro ao excluir produto');

        // O nome vem dentro de data.data.nome no backend
        const nomeProduto = data.data?.nome || nomeLocal;

        console.log('✅ Produto excluído:', data);
        mostrarNotificacao(`Produto "${nomeProduto}" excluído com sucesso!`, 'sucesso');
        await buscarProdutos();
    } catch (error) {
        console.error('❌ Erro ao excluir produto:', error);
        mostrarNotificacao(`Erro ao excluir produto: ${error.message}`, 'erro');
    }
}

// 5. FUNÇÕES DE INTERFACE
function renderizarProdutos() {
    elementos.loadingProdutos.classList.add('hidden');

    if (produtos.length === 0) {
        elementos.listaVazia.classList.remove('hidden');
        elementos.gridProdutos.classList.add('hidden');
        elementos.contadorProdutos.classList.add('hidden');
    } else {
        elementos.listaVazia.classList.add('hidden');
        elementos.gridProdutos.classList.remove('hidden');
        elementos.contadorProdutos.classList.remove('hidden');

        elementos.gridProdutos.innerHTML = produtos.map(produto => `
            <div class="produto-card bg-white p-6 rounded-lg shadow-md animate-fadeIn">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-800 mb-2">${produto.nome}</h3>
                        <p class="text-2xl font-bold text-padaria-green mb-2">${formatarMoeda(produto.preco)}</p>
                    </div>
                    <button 
                        class="btn-excluir text-padaria-red hover:bg-red-50 p-2 rounded-lg transition tooltip"
                        data-produto-id="${produto.id}"
                        data-produto-nome="${produto.nome}"
                        data-tooltip="Excluir produto"
                    >
                        🗑️
                    </button>
                </div>
                ${produto.descricao ? `<p class="text-gray-600 text-sm mb-4 line-clamp-3">${produto.descricao}</p>` : ''}
                <div class="text-xs text-gray-400 border-t pt-3">
                    📅 Cadastrado em ${formatarData(produto.created_at)}
                </div>
            </div>
        `).join('');

        elementos.totalProdutos.textContent = produtos.length;
    }
}

function confirmarExclusao(id, nome) {
    produtoParaExcluir = id;
    elementos.produtoNome.textContent = nome;
    elementos.modalConfirmacao.classList.remove('hidden');
    elementos.modalConfirmacao.classList.add('flex');
}

function cancelarExclusao() {
    produtoParaExcluir = null;
    elementos.modalConfirmacao.classList.add('hidden');
    elementos.modalConfirmacao.classList.remove('flex');
}

async function executarExclusao() {
    if (produtoParaExcluir) {
        const idParaExcluir = produtoParaExcluir;
        cancelarExclusao();
        await excluirProduto(idParaExcluir);
    }
}

function toggleLoadingCadastro(loading) {
    if (loading) {
        elementos.btnTexto.classList.add('hidden');
        elementos.btnLoading.classList.remove('hidden');
        elementos.btnCadastrar.disabled = true;
    } else {
        elementos.btnTexto.classList.remove('hidden');
        elementos.btnLoading.classList.add('hidden');
        elementos.btnCadastrar.disabled = false;
    }
}

// 6. EVENT LISTENERS
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Página carregada, iniciando aplicação...');
    testarConexao();
    buscarProdutos();
});

elementos.formProduto.addEventListener('submit', async function(e) {
    e.preventDefault();
    const dadosProduto = {
        nome: elementos.inputNome.value.trim(),
        preco: parseFloat(elementos.inputPreco.value),
        descricao: elementos.inputDescricao.value.trim() || null
    };

    if (!dadosProduto.nome) {
        mostrarNotificacao('Nome do produto é obrigatório', 'erro');
        elementos.inputNome.focus();
        return;
    }
    if (!dadosProduto.preco || dadosProduto.preco <= 0) {
        mostrarNotificacao('Preço deve ser maior que zero', 'erro');
        elementos.inputPreco.focus();
        return;
    }

    toggleLoadingCadastro(true);
    try { await cadastrarProduto(dadosProduto); } 
    finally { toggleLoadingCadastro(false); }
});

elementos.btnAtualizar.addEventListener('click', buscarProdutos);
elementos.btnCancelar.addEventListener('click', cancelarExclusao);
elementos.btnConfirmar.addEventListener('click', executarExclusao);

elementos.modalConfirmacao.addEventListener('click', function(e) {
    if (e.target === elementos.modalConfirmacao) cancelarExclusao();
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !elementos.modalConfirmacao.classList.contains('hidden')) cancelarExclusao();
});

// ✅ Event listener robusto para botões de excluir
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-excluir')) {
        const produtoIdString = e.target.dataset.produtoId;
        const produtoNome = e.target.dataset.produtoNome;

        if (!produtoIdString) {
            console.error('❌ ID do produto não encontrado no dataset');
            mostrarNotificacao('Erro: ID do produto não encontrado', 'erro');
            return;
        }

        const produtoId = parseInt(produtoIdString, 10);
        if (isNaN(produtoId) || produtoId <= 0) {
            console.error('❌ ID do produto inválido:', produtoIdString);
            mostrarNotificacao('Erro: ID do produto inválido', 'erro');
            return;
        }

        console.log('✅ Dados válidos - ID:', produtoId, 'Nome:', produtoNome);
        confirmarExclusao(produtoId, produtoNome);
    }
});

// 7. FUNÇÕES GLOBAIS
window.confirmarExclusao = confirmarExclusao;
window.cancelarExclusao = cancelarExclusao;
window.executarExclusao = executarExclusao;

// 8. TRATAMENTO DE ERROS GLOBAIS
window.addEventListener('error', function(e) {
    console.error('❌ Erro não tratado:', e.error);
    mostrarNotificacao('Ocorreu um erro inesperado. Verifique o console.', 'erro');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('❌ Promise rejeitada:', e.reason);
    mostrarNotificacao('Erro de conexão. Verifique se o backend está rodando.', 'erro');
});

// 9. LOGS PARA DEBUG
console.log('🎯 Script carregado com sucesso!');
console.log('📡 API Base URL:', API_BASE_URL);
console.log('🔧 Para debug, use: window.produtos, window.elementos');
window.produtos = produtos;
window.elementos = elementos;