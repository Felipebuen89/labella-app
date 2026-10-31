# Plataforma White-Label para Franquias — V1
Versão de trabalho separada da Moments Paris. Branch: `franquias-white-label-v1`.

## Personalização
Configure `brand-config.js` para cada implantação: nome, iniciais, slogan, logoUrl (opcional), cor primária e catálogo. Não copie dados reais, imagens proprietárias nem permissões da Moments Paris para clientes de outra rede.

## Escopo entregue
- Identidade genérica: sem foto dos proprietários; preto/cinza e dourado-champagne; tipografia, cartões, métricas, botões, responsividade e acesso da franquia revisados.
- Mesma navegação de pedidos, estoque, financeiro, benefícios e administração. Catálogo demonstrativo multissetorial.
- Separação entre app e painel pelo caminho `/franquia/`.
- **Modo demonstração local**: dados gravados exclusivamente no navegador. Não representa autenticação real, sincronização entre aparelhos, push entregue ou separação segura entre franquias.

## Antes de comercializar como SaaS
1. Criar tabelas multi-tenant com `franchise_id` e isolamento por RLS (Supabase).
2. Autenticação confiável da franquia e revendedores, escopos RBAC e convites; nunca considerar PIN JS como segurança.
3. API segura de pedidos, estoque, financeiro, notificações e relatórios por tenant.
4. Upload/gestão de catálogo e logo, domínio/subdomínio e configuração por rede.
5. Testes automatizados, mobile/PWA, LGPD, backup e observabilidade.
6. Criar serviço de staging próprio no Render. Não apontar a demo para o backend Moments Paris.

Para recuperar a versão original, acesse a branch `moments-paris-demo` (inalterada).
