// ===================================
// SERVIDOR BACKEND - TUTORIAL SUPABASE
// ===================================
// Este arquivo contém toda a lógica do servidor backend
// Aqui criamos uma API REST que se conecta ao Supabase

// 1. IMPORTAR DEPENDÊNCIAS
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 2. CONFIGURAR O SERVIDOR EXPRESS
const app = express();
const PORT = process.env.PORT || 3000;

// 3. CONFIGURAR MIDDLEWARES
app.use(cors());
app.use(express.json());

// 4. CONEXÃO COM SUPABASE
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: Configurações do Supabase não encontradas!');
    console.log('📝 Verifique se o arquivo .env existe e contém:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Conexão com Supabase configurada!');

// 5. ROTAS DA API

// ROTA DE TESTE
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API funcionando perfeitamente!',
        timestamp: new Date().toISOString()
    });
});

// BUSCAR TODOS OS PRODUTOS
app.get('/api/produtos', async (req, res) => {
    try {
        console.log('📋 Buscando produtos...');
        const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erro ao buscar produtos:', error);
            return res.status(400).json({
                success: false,
                message: 'Erro ao buscar produtos',
                error: error.message
            });
        }

        console.log(`✅ ${data.length} produtos encontrados`);
        res.json({
            success: true,
            data: data,
            total: data.length
        });
    } catch (error) {
        console.error('❌ Erro interno:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// CADASTRAR NOVO PRODUTO
app.post('/api/produtos', async (req, res) => {
    try {
        const { nome, preco, descricao } = req.body;
        console.log('➕ Cadastrando produto:', { nome, preco, descricao });

        if (!nome || !preco) {
            return res.status(400).json({
                success: false,
                message: 'Nome e preço são obrigatórios'
            });
        }

        if (isNaN(preco) || preco <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Preço deve ser um número maior que zero'
            });
        }

        const { data, error } = await supabase
            .from('produtos')
            .insert([
                {
                    nome: nome.trim(),
                    preco: parseFloat(preco),
                    descricao: descricao ? descricao.trim() : null
                }
            ])
            .select();

        if (error) {
            console.error('❌ Erro ao cadastrar produto:', error);
            return res.status(400).json({
                success: false,
                message: 'Erro ao cadastrar produto',
                error: error.message
            });
        }

        console.log('✅ Produto cadastrado com sucesso:', data[0]);
        res.status(201).json({
            success: true,
            message: 'Produto cadastrado com sucesso!',
            data: data[0]
        });
    } catch (error) {
        console.error('❌ Erro interno:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// EXCLUIR PRODUTO (corrigido para retornar o nome correto)
app.delete('/api/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Excluindo produto ID:', id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID deve ser um número válido'
            });
        }

        // 🔎 Busca o produto antes de excluir para pegar o nome
        const { data: produtoAntes, error: erroBusca } = await supabase
            .from('produtos')
            .select('id, nome')
            .eq('id', parseInt(id))
            .single();

        if (erroBusca) {
            console.error('❌ Erro ao buscar produto antes de excluir:', erroBusca);
            return res.status(400).json({
                success: false,
                message: 'Erro ao buscar produto antes de excluir',
                error: erroBusca.message
            });
        }

        if (!produtoAntes) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        // 🧹 Agora deleta o produto
        const { error: erroDelete } = await supabase
            .from('produtos')
            .delete()
            .eq('id', parseInt(id));

        if (erroDelete) {
            console.error('❌ Erro ao excluir produto:', erroDelete);
            return res.status(400).json({
                success: false,
                message: 'Erro ao excluir produto',
                error: erroDelete.message
            });
        }

        console.log(`✅ Produto "${produtoAntes.nome}" excluído com sucesso!`);
        res.json({
            success: true,
            message: `Produto "${produtoAntes.nome}" excluído com sucesso!`,
            nome: produtoAntes.nome
        });
    } catch (error) {
        console.error('❌ Erro interno:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// SERVIR FRONTEND
app.use(express.static('../frontend'));

// ROTA PADRÃO (404)
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        availableRoutes: [
            'GET /api/test',
            'GET /api/produtos',
            'POST /api/produtos',
            'DELETE /api/produtos/:id'
        ]
    });
});

// 6. INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log('🚀 ================================');
    console.log('🥖 SERVIDOR PADARIA INICIADO!');
    console.log('🚀 ================================');
    console.log(`📡 Servidor rodando na porta: ${PORT}`);
    console.log(`🌐 URL local: http://localhost:${PORT}`);
    console.log(`📋 API disponível em: http://localhost:${PORT}/api`);
    console.log('🚀 ================================');
    console.log('');
    console.log('📝 Rotas disponíveis:');
    console.log('   GET  /api/test           - Testar API');
    console.log('   GET  /api/produtos       - Listar produtos');
    console.log('   POST /api/produtos       - Cadastrar produto');
    console.log('   DELETE /api/produtos/:id - Excluir produto');
    console.log('');
    console.log('⏹️  Para parar o servidor: Ctrl + C');
    console.log('🚀 ================================');
});