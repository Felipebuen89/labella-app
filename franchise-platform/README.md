# RedeOS — plataforma white-label para franquias

**Status: protótipo interativo / demonstração local (V1)**. Criado a partir do conceito de módulos do app Moments Paris, sem reutilizar seus dados reais, fotos de proprietários, credenciais, logotipo ou backend.

## Como testar
Hospede a pasta franchise-platform em um servidor HTTPS estático e abra index.html. Use o botão "Alternar visão" para trocar entre revendedor e franquia. Não há autenticação: a troca é apenas demonstrativa.

Modelos fictícios independentes:
- ?rede=aurora — Aurora Cosméticos
- ?rede=viva — Viva Pet

Em Visão da franquia → Configurações, altere o nome, subtítulo, logo HTTPS e revendedor fictício, ou troque de segmento. Os dados de cada modelo ficam em chaves separadas do localStorage do navegador. A paleta mantém preto e champagne.

## Fluxo de demonstração
1. Revendedor → Pedidos: adicionar produtos e enviar solicitação.
2. Franquia → Pedidos: aprovar e mudar para Pronto para retirada.
3. Revendedor → Pedidos: confirmar recebimento; estoque atualizado.
4. Revendedor → Estoque: registrar venda; verificar em Financeiro.
5. Franquia → Campanhas: publicar promoção que aparece em Benefícios.
6. Franquia → Configurações: personalizar marca.
7. Financeiro: exportar CSV. Pedidos: imprimir ou salvar como PDF no navegador.

## Limites e segurança
- Sem API, banco central, push real, cobrança ou login seguro.
- Sem isolamento entre clientes no servidor: as franquias nesta demo existem apenas no navegador.
- Contatos e produtos são todos fictícios. Não use clientes reais.
- Dados não sincronizam entre dispositivos; limpeza do navegador os apaga.
- URL externa de logo depende da disponibilidade do fornecedor.
- O aplicativo original da Moments Paris não foi alterado.

## Para comercializar
1. Backend com autenticação, vinculação de conta e tenant_id obrigatório em dados e operações.
2. Isolamento por franquia implementado no servidor e no banco, nunca somente por parâmetros do navegador.
3. Papéis e permissões, convites, logs, auditoria e recuperação de conta.
4. Catálogo configurável, preços/comissões e regras comerciais por segmento.
5. Transações seguras e idempotentes para pedidos, estoque e vendas.
6. Push com consentimento, fila de entrega e diagnóstico de notificações.
7. LGPD: minimização, transparência, retenção, exportação/remoção, backups e controles de segurança.
8. Testes em Android/iOS, homologação, assinatura, integração com gateway e monitoramento.
