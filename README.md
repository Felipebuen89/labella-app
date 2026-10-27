# La'Bella Hair Company — demonstração

Protótipo mobile-first para apresentação de uma proposta de aplicativo ao salão La'Bella Hair Company.

## Telas
- Início com destaque visual
- Serviços com filtros
- Solicitação demonstrativa de agendamento (não efetua reserva)
- Galeria com imagens ilustrativas externas
- Clube de fidelidade conceitual (não implementado)

**Importante:** Este não é um aplicativo oficial do salão. As fotos são ilustrativas e não representam trabalhos executados pela empresa. Não há coleta de informações em servidor nem integração de agendamento real.

## Publicação gratuita no GitHub Pages

1. Acesse **Settings → Pages** do repositório.
2. Em **Build and deployment / Source**, selecione **Deploy from a branch**.
3. Selecione **main** e **/(root)** e clique **Save**.
4. Após o GitHub concluir a implantação, visite `https://felipebuen89.github.io/labella-app/`.

O arquivo inicial é `index.html`. Requer conexão à internet para carregar fotos de referência. Não há hospedagem paga.

## Próximos passos antes do uso comercial
Validar marca, fotografias, lista de serviços, horários, política de privacidade e qualquer fluxo de agendamento com o salão.
## Nova demonstração premium (Studio Aura V7)

Esta versão é um conceito separado e não altera o La’Bella original.

- Cliente: https://felipebuen89.github.io/labella-app/studio-aura-v7.html
- Proprietário: https://felipebuen89.github.io/labella-app/studio-aura-v7.html?painel=1

Inclui home nova, catálogo, agendamento com horários livres por profissional, reagendamento sem cancelar antes da confirmação, perfil do cliente, clube de pontos com resgates ilustrativos, agenda de gestão, financeiro demonstrativo e campanhas com botão **Publicar no demo**. Após publicação, a campanha aparece na home do aplicativo no mesmo navegador. Ao marcar como concluído um atendimento do cliente demonstrativo, os pontos são creditados uma só vez.

**Limitações importantes:** dados fictícios em localStorage do navegador (não sincronizam entre aparelhos), sem autenticação de verdade, notificações push, pagamentos, reservas remotas ou programa de benefícios oficial. Imagens, serviços e valores ilustrativos. É necessário backend seguro, contas/permissões, consentimento e validação com o estabelecimento para operação real.

### Roteiro de teste manual
1. Abrir o cliente e criar um agendamento para um horário livre; verificar em Minha agenda.
2. Abrir o painel **no mesmo navegador** e ir a Agenda; confirmar e concluir o atendimento.
3. Voltar ao cliente, abrir Clube e observar o saldo de pontos da demonstração.
4. No painel, criar uma campanha, salvar rascunho e clicar em Publicar no demo; voltar à home do cliente.
5. Em Minha agenda, usar Reagendar e verificar que a reserva anterior é preservada até finalizar a nova solicitação.
