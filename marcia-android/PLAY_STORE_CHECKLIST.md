# Checklist Play Store — Márcia Calixto

**Situação:** estrutura de compilação Android para teste interno. Não representa aprovação de publicação e **não é AAB de produção**.

## Concluído no protótipo

- [x] App cliente e painel do proprietário em telas distintas no projeto original.
- [x] Gerador Android configurado para montar apenas a experiência da cliente.
- [x] Capacitor 8 com identificador provisório e SDK 36 previsto.
- [x] Código-base dos serviços, avaliação, pacotes, agendamentos de demonstração, campanhas e pontos.
- [x] Página pública explicando privacidade exclusivamente da demonstração.
- [x] Workflow manual que tenta produzir **APK debug** para testes internos (não envio automático à Google Play).

## Antes de compilar em Android real

- [ ] Executar o workflow e confirmar **sucesso** do Gradle. Nenhum APK/AAB foi gerado nesta conversa.
- [ ] Testar navegação, retorno Android, orientação, telas pequenas, acessibilidade e desempenho.
- [ ] Substituir fontes e imagens externas não licenciadas para uso definitivo.
- [ ] Criar iconografia adaptativa, splash, ícone 512 × 512 e screenshots próprios.
- [ ] Verificar ADB/logcat, ANR, falhas e comportamento offline.
- [ ] Escolher identificador de pacote definitivo e versionCode antes da primeira publicação.

## Antes de abrir teste fechado no Google Play

- [ ] Autorização formal de Márcia Calixto para nome, marca, fotografias, tratamento dos dados e publicação.
- [ ] Validar e aprovar catálogo real, profissionais habilitados, indicação e comunicação de saúde.
- [ ] Implementar contas individuais, separação cliente/gestão no servidor e autorização por perfil.
- [ ] Back-end seguro para reservas, horários, pacotes, pontos e campanhas (não localStorage).
- [ ] Definir integrações, opt-in de comunicação, notificação push e controle de consentimentos.
- [ ] Revisar LGPD e documentos legais com o controlador dos dados.
- [ ] Publicar **política definitiva** com URL pública e dentro do app; página demo não substitui.
- [ ] Completar formulário de Saúde do Play Console e a seção Segurança dos dados.
- [ ] Definir público-alvo, classificação indicativa, acesso de revisão, detalhes do app e exclusão de conta, se aplicável.
- [ ] Certificado de upload privado, App Signing Google Play e gerar AAB **assinado**.
- [ ] Conta pessoal criada após 13/11/2023: cumprir teste fechado de pelo menos **12 pessoas por 14 dias consecutivos**, se aplicável.
- [ ] Revisar eventuais exigências novas na data de envio.

## Comandos locais

```bash
cd marcia-android
npm install
npm run build:web
npx cap add android
npm run android:check
cd android
./gradlew assembleDebug
# Android Studio: Build > Generate Signed Bundle / APK > Android App Bundle
```

O projeto usa Capacitor 8 para compatibilidade com target SDK 36 (Google Play exige Android 16 API 36 para novos apps desde 31/08/2026). Não copie uma chave secreta ou senha para arquivos versionados ou para esta conversa.

Fontes oficiais: https://developer.android.com/google/play/requirements/target-sdk · https://capacitorjs.com/docs/getting-started/environment-setup · https://support.google.com/googleplay/android-developer/answer/16679511 · https://support.google.com/googleplay/android-developer/answer/14151465
