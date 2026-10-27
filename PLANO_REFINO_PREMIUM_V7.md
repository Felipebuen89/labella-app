# Move Digital — Auditoria e reconstrução premium V7
Data: 27/10/2026
Status: protótipo navegável publicado em `studio-aura-v7.html`, sem alterar o La'Bella original.
Nova marca demonstrativa: Studio Aura (fictícia; substituir após confirmação da empresa).

## 1. Referências verificadas
- Booksy Google Play: 4,9/5; cerca de 1,01 milhão de avaliações. Ênfase em agendamento rápido, profissionais, lembretes e remarcação. https://play.google.com/store/apps/details?id=net.booksy.customer&hl=pt-BR
- Fresha Google Play: 4,9/5; cerca de 117 mil avaliações. Horários em tempo real, reservas e pagamentos. https://play.google.com/store/apps/details?id=com.fresha.Fresha&hl=pt-BR
- Fresha fidelidade: níveis, pontos, benefícios, histórico e indicações. https://www.fresha.com/help-center/knowledge-base/clients/101624-understand-how-clients-engage-with-your-loyalty-program
- Trinks App Store Brasil: 4,9/5; cerca de 48 mil avaliações. Profissionais favoritos, serviços, preços, agenda e pontos. https://apps.apple.com/br/app/trinks-com/id628518776
- AppBarber Cliente App Store Brasil: 4,9/5; cerca de 106 mil avaliações. Agenda, lembretes, campanhas, avaliações e histórico. https://apps.apple.com/br/app/appbarber-cliente/id6450795073
- Trinks Profissional App Store Brasil: 4,8/5; agenda, status, clientes e resumos financeiros. https://apps.apple.com/br/app/trinks-profissional/id1514616279
Notas são fotografias das lojas na data da pesquisa, não ranking universal.

## 2. Aprendizado de produto
**Diferencial da Move Digital:** aplicativo white-label de uma única empresa, com marca, portfólio, agenda e clube próprios. Marketplace ajuda descoberta mas pode mostrar concorrentes. Cliente precisa conseguir reservar em poucos passos; proprietário precisa gerir sem esforço.

## 3. Auditoria tela a tela — Cliente
| Tela | Dor da versão anterior | Decisão V7 | Pronto no demo |
|---|---|---|---|
| Início | Hero longo e conteúdo distante do primeiro CTA | Capa editorial, CTA visível, próximo agendamento, serviços e clube | Sim |
| Catálogo | Serviços sem preço/duração e pouca comparação | Filtros, fotos, preço, duração, CTA em cada card | Sim, preços fictícios |
| Agendar | Pedido apenas verbal, agenda não persiste | Serviço, profissional, 10 dias, horários compatíveis, resumo e confirmação | Sim, no mesmo navegador |
| Próximas visitas | Cliente não visualizava histórico de reservas | Lista de reservas, situação e cancelamento/remarcação | Sim, local |
| Clube | Cartão visual mas sem mecânica clara | Carteira de pontos, régua, resgate, benefícios e regras | Sim, exemplo local |
| Perfil | Preferências dispersas | Conta, notificações, histórico e acesso claro | Sim, preferências demo |

## 4. Auditoria tela a tela — Proprietário
| Tela | Dor | Decisão V7 | Pronto no demo |
|---|---|---|---|
| Visão geral | Gestão sem prioridade | Agendamentos, pendências, clientes, receita concluída, atalhos | Sim |
| Agenda | Informação isolada | Timeline por hora, cartões com cliente, serviço, profissional, situação | Sim |
| Clientes | Sem relacionamento histórico integrado | Lista simplificada e quantas visitas | Sim, demo |
| Campanhas | Ações sem prévia | Criar texto, ver modelo e salvar rascunho | Sim, sem envios |
| Fidelidade | Pontos sem regra operacional | R$ 1 = 1 ponto na conclusão; 500 pontos = R$ 50 | Sim, exemplo não vinculante |
| Financeiro | Indicadores simulados desconectados | Receita estimada vs concluída e lançamentos por atendimento | Sim, local |

## 5. Regras importantes
- Demo **não representa** agenda online real: estado fica no localStorage e não é compartilhado entre celulares, navegadores ou dispositivos.
- Não há login real ou autorização no modo demo. A rota `?painel=1` é publicamente acessível.
- Notificações e campanhas não são enviadas; só há preferências e rascunhos.
- Fotos, profissionais, serviços, preços, pontos e a marca Studio Aura são exemplos.
- Na remarcação, reserva anterior só é cancelada depois de confirmar a nova, evitando perda antecipada do horário no exemplo.
- Resgate é fictício; configuração de vencimento, devolução por cancelamento, prevenção de fraude e auditoria serão necessárias para produção.
- Para produção: LGPD, consentimento, autenticação segura por perfil, RLS/multitenancy, Supabase ou backend, agenda transacional com controle de concorrência, notificações push autorizadas e testes reais em Android/iOS.

## 6. Especificações de design adotadas
- Interface do cliente: fundo off-white, vinho profundo, cobre suave e fotos grandes.
- Títulos editoriais em serif + corpo sem serifa legível; ações com área de toque adequada.
- Navegação inferior com cinco pontos: Início / Serviços / Agendar / Clube / Conta.
- Painel de gestão separado do cliente; barra lateral desktop e guias roláveis mobile.
- Redução de ornamentação e de textos muito pequenos, ação principal destacada em cada tela.
- Componentes com foco visível, contraste, estados de erro e mensagens sem simular operações reais.

## 7. Próxima migração para a marca escolhida
1. Substituir Studio Aura pelo nome, logo, fotos, cores e endereço oficial do estabelecimento.
2. Confirmar catálogo real: nomes, duração, intervalo entre atendimentos, preço e profissionais.
3. Decidir regras de clube: pontuação, resgate, validade, elegibilidade, descontos e teto financeiro.
4. Conectar dados reais via backend seguro e perfis Cliente / Funcionário / Proprietário.
5. Testar notificações PWA no iPhone e Android e depois empacotamento/distribuição conforme canais definidos.
6. Validar revisão visual e acessibilidade com 5 clientes e 2 proprietários antes do lançamento.

## 8. Testes de aceitação do fluxo mínimo
- [ ] Abrir na tela de 360 px, 390 px e 430 px sem overflow.
- [ ] Catálogo filtra sem esconder CTA.
- [ ] Reservar horário exibe no cliente e painel no **mesmo navegador**.
- [ ] Dois agendamentos do mesmo profissional não se sobrepõem.
- [ ] Cancelar e remarcar mostra status correto.
- [ ] Remarcar e abandonar mantém a reserva antiga.
- [ ] Concluir uma visita credita pontos uma única vez.
- [ ] Resgatar só é possível quando saldo >= 500.
- [ ] Salvar campanha não dispara notificações.
- [ ] Separar demo de backend/contas reais.

Publicado (prévia cliente): https://felipebuen89.github.io/labella-app/studio-aura-v7.html
Publicado (prévia gestão): https://felipebuen89.github.io/labella-app/studio-aura-v7.html?painel=1
Original intocado: https://felipebuen89.github.io/labella-app/
