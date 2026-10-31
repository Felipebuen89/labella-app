# TreinoLab Coach — avaliação e ciclos de treino (31/10/2026)

Aplicativo publicado no GitHub Pages: https://felipebuen89.github.io/labella-app/

## O que foi implementado

- Múltiplos perfis locais (ex.: duas pessoas no mesmo iPhone); sem login nem sincronização.
- Avaliação inicial para maiores de 18 anos: nome, sexo, idade, peso, altura, objetivo, experiência, local, dias/semana (2–6), tempo/sessão (20–90 min), início, ciclo de 4–12 semanas, lipedema, sintomas, condições e liberação profissional.
- Planejamento com divisão full body, superior/inferior ou grupos por frequência; tempo reservado a aquecimento, parte principal, cardio opcional e volta à calma.
- Modo lipedema: preferência por baixo impacto e fortalecimento tolerável, progressão conservadora, bloqueio em caso de sintomas agudos e alerta para avaliação clínica.
- Carga inicial: orientação de calibragem por execução e repetições em reserva (RIR), **não há estimativa de kg com base em sexo/altura/peso**; após treinos registrados é possível apresentar faixa conservadora de progressão de 2–5% somente se executou duas sessões semelhantes com boa margem e sem dor.
- Registro de séries, repetições, cargas, RIR e dor, com histórico e volume.
- Datas de início e fim calculadas em calendário local; reavaliação no fim do ciclo (sem substituição automática, respeitando a recuperação e os sintomas).
- Biblioteca de exercícios com links externos de vídeos YouTube (busca, não curadoria) e fotos técnicas ACE para exercícios conferidos; para os demais, busca externa de imagens (sem validação).
- Backup JSON por perfil.

## Cuidados de saúde e privacidade

O TreinoLab é **ferramenta educativa**, não um profissional de Educação Física registrado no CREF, e não diagnostica nem trata lipedema. A Lei 9.696/1998 reserva a atuação profissional a pessoas habilitadas. A avaliação é limitada, não mede técnica, força máxima nem tolerância tecidual. Pessoas com lipedema devem discutir limitações e adaptação com equipe de saúde e profissional de Educação Física.

As informações pessoais e de saúde ficam em localStorage no aparelho; não há servidor, login, sincronização criptografada ou autenticação. Qualquer pessoa com acesso ao navegador no mesmo dispositivo pode ver os perfis. Exportar backup antes de limpar dados ou trocar de celular. Ao abrir links externos (ACE, YouTube ou pesquisa de imagens), as políticas desses sites se aplicam.

## Evidências utilizadas
- ACSM Position Stand 2026: https://acsm.org/resistance-training-guidelines-update-2026/
- WHO recomendações: https://www.who.int/initiatives/behealthy/physical-activity/
- ACSM progressão de treinamento: https://pubmed.ncbi.nlm.nih.gov/11828249/
- NSCA frequência para iniciantes: https://www.nsca.com/education/articles/kinetic-select/determination-of-resistance-training-frequency/
- S2k Lipedema 2024: https://doi.org/10.1111/ddg.15513
- U.S. lipedema standard of care: https://pmc.ncbi.nlm.nih.gov/articles/PMC8652358/
- Revisão sistemática exercício e lipedema: https://pubmed.ncbi.nlm.nih.gov/41243294/
- ACE Exercise Library: https://www.acefitness.org/resources/everyone/exercise-library/
- Lei 9.696: https://www2.camara.leg.br/legin/fed/lei/1998/lei-9696-1-setembro-1998-374623-normaatualizada-pl.html

## Testes automáticos
\`treinolab/tests.cjs\` com GitHub Actions \`.github/workflows/treinolab-qa.yml\`.

---

# TreinoLab — montador de treino gratuito (PWA)

**Aplicativo principal:** https://felipebuen89.github.io/labella-app/

A página inicial do repositório foi transformada no TreinoLab em 31/10/2026, a pedido do proprietário do repositório. A versão anterior do salão La'Bella está preservada na branch \`backup-labella-2026-10-31\`.

**Recursos:** gerar treino por objetivo (hipertrofia, emagrecimento, condicionamento ou força), nível e 2–6 dias por semana; exercícios de casa ou academia; editar planos, séries e repetições; cronômetro de descanso; registrar exercícios feitos, pesos e repetições; histórico e gráficos; backup JSON de exportação/importação.

**Dados e limitações:** não exige login nem mensalidade; informações ficam apenas no localStorage do dispositivo e navegador. Não há sincronização entre aparelhos, IA, conta, banco de dados nem orientação profissional individual. Limpar os dados do navegador pode apagar os registros; exporte backups regularmente. O app apresenta sugestões gerais, não substitui orientação profissional.

**Instalação:** iPhone Safari → Compartilhar → Adicionar à Tela de Início. Android Chrome → menu → Instalar app/Adicionar à tela inicial.

**Escopo da migração:** somente \`index.html\`, \`manifest.webmanifest\`, \`sw.js\`, \`icon.svg\`, os ícones gerados por GitHub Actions e documentação foram adaptados. Pastas e arquivos de outros protótipos no repositório não foram apagados.

---

## Histórico do protótipo La'Bella (preservado)
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
