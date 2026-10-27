# Márcia Calixto — base Android Play Store (prévia Move Digital)

**Não é aplicativo oficial, não está pronto para produção, e não deve ser enviado à Google Play sem autorização da clínica.** O projeto usa `../marcia-app.html` como fonte de interface, para preservar a versão web e evitar arquivos divergentes.

## Pré-requisitos

- Node.js 22+, Android Studio, Android SDK 36 e ferramentas de desenvolvimento Android compatíveis com a versão escolhida do Capacitor.
- Autorização formal da proprietária para uso da marca, imagens, serviços e publicação; escolher **identificador de pacote definitivo** ANTES do primeiro envio à loja.
- Conta no Google Play Console com titular e dados verificados.

## Preparação e compilação

Execute a partir de `marcia-android/`:

```bash
npm install
npm run build:web
npx cap add android
npm run android:sync
npm run android:check
npm run android:open
```

O comando `npx cap add android` deve ser executado só na primeira vez. Depois, use `npm run android:sync` a cada atualização do HTML. Abra o projeto gerado no Android Studio para compilar, testar e depois usar **Build > Generate Signed Bundle / APK > Android App Bundle**.

**Ainda não foi compilado nenhum APK/AAB por este projeto.** O identificador `br.com.movedigital.marcia.preview` é PROVISÓRIO, não é a identidade aprovada para produção. Também falta criar os ícones adaptativos, splash e screenshots com artes e direitos autorizados. Não utilize um certificado de assinatura de teste para lançar um aplicativo real.

## Critérios técnicos e de produto antes de publicar

1. Confirmar catálogo, profissionais, agenda, preços, localização, equipamentos e habilitações; separar procedimentos de avaliação.
2. Implementar autenticação para clientes e gestão, integração segura com banco de dados e autorização por perfil.
3. Garantir reservas e sessões sincronizadas entre dispositivos, concorrência e regras de cancelamento.
4. Implementar push com opt-in, finalidade determinada e tratamento adequado de dados.
5. Substituir o armazenamento local de exemplo por infraestrutura compatível com a LGPD; excluir qualquer dado real da versão demo.
6. Publicar **política de privacidade real** (a página `marcia-privacidade-demo.html` NÃO atende como documento final).
7. Completar formulários Play Console: segurança de dados, declaração de apps de saúde, permissões, público-alvo, conteúdo e acesso à conta.
8. Verificar o target SDK: para novos apps em outubro/2026, **Android 16, API 36 ou superior**.
9. Executar testes de instalação, navegação, acessibilidade, performance e estabilidade em aparelhos reais. Contas pessoais novas precisam do teste fechado mínimo aplicável.
10. Gerar AAB assinado, carregar na faixa apropriada do Console, revisar relatórios de qualidade e solicitar lançamento.

## Fontes oficiais

- https://capacitorjs.com/docs/getting-started
- https://support.google.com/googleplay/android-developer/answer/11926878
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/googleplay/android-developer/answer/16679511
- https://support.google.com/googleplay/android-developer/answer/9898783

## Estrutura

`package.json`: dependências e comandos.
`capacitor.config.json`: configuração básica com appId provisório.
`scripts/build-web.mjs`: atualiza `www/index.html` a partir do protótipo.
`scripts/check-play.mjs`: verifica presença do projeto e API desejada.
`www/` e `android/`: gerados pelas ferramentas, ainda não versionados nesta etapa.
