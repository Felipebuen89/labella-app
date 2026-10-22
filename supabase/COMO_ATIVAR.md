# La’Bella — Agenda Inteligente V6.2

## Estado atual

- **Prévia visual:** no GitHub Pages, com logotipo e fotografias enviados pelo usuário.
- **Agenda demonstrativa:** cliente escolhe serviço e data, vê horários livres/ocupados; proprietário altera duração e expediente localmente nesta demonstração. Não grava.
- **Backend preparado:** `supabase/schema.sql`, `backend.js`, `config.js`. Não está ativo enquanto o projeto Supabase não estiver conectado.
- **Reserva real:** só habilitada após Supabase configurado, esquema aplicado e usuário proprietário criado. Nunca chamar de reserva real antes de testar gravação e concorrência.

## Ativação sem expor dados pessoais

1. Conectar/criar um projeto Supabase sob controle da proprietária ou do responsável autorizado.
2. Na aba SQL Editor do projeto, executar o conteúdo de `supabase/schema.sql` após revisão técnica, uma única vez.
3. No Supabase Authentication, cadastrar o e-mail da proprietária. Em seguida, inserir o UID da conta em `public.lb_staff` no SQL Editor. **Nunca fazer essa inclusão pelo navegador.**
4. Configurar as regras de redirecionamento de Auth para `https://felipebuen89.github.io/labella-app/`. Habilitar e testar login via link enviado por e-mail.
5. Em `config.js`, preencher somente o **Project URL** e a **chave pública/publishable (anon)**. Jamais colocar `service_role` nem tokens privados em arquivos públicos.
6. Configurar no painel os serviços reais, duração, tempo de limpeza/preparação, dias, intervalos e expediente; as configurações atuais são *exemplos* e não dados oficiais do salão.
7. Rodar homologação: duas tentativas simultâneas para o mesmo horário; bloqueio manual; cancelamento; virada do dia; último horário do expediente; variação de duração; permissão de cliente anônimo versus proprietária.
8. Antes da abertura a clientes reais: aprovar a Política de Privacidade/LGPD (dados de nome e telefone), adicionar proteção contra spam/CAPTCHA e confirmar a autorização para uso público do logotipo, fotos e dados da La’Bella.

## Regras já codificadas no banco

- O proprietário controla a duração em minutos e buffer por serviço.
- Cada profissional possui expediente por dia da semana, intervalos de início e bloqueios.
- O cliente vê início de horários livres/ocupados, não nomes de outros clientes.
- Horário disponível só se a duração total couber no expediente e não sobrepor nenhuma reserva ou bloqueio.
- A função de reserva revalida o horário no servidor; transações concorrentes usam trava por profissional/dia, com exclusão temporal adicional no banco.
- Reservas confirmadas ocupam o intervalo até serem canceladas pelo painel.
- O acesso aos nomes e telefones só é permitido a contas cadastradas em `lb_staff`.
- Estrutura suporta múltiplos profissionais, apesar da primeira tela usar uma profissional por vez.

## Limitações atuais

- No modo demonstrativo, não há reservas compartilhadas entre aparelhos.
- O backend não foi aplicado a banco real neste estágio; sem conexão Supabase, não há gravação.
- O fluxo de confirmação por WhatsApp, lembretes e pagamentos não faz parte da V6.2.
- É obrigatório validar o serviço, o horário e a autorização antes de operar com clientes reais.

## Links do projeto

- Repositório: https://github.com/Felipebuen89/labella-app
- Prévia: https://felipebuen89.github.io/labella-app/
