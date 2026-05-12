# Hostinger deploy package

Esta pasta guarda instrucoes e arquivos gerados para deploy por ZIP na Hostinger.

O pacote gerado atual fica em:

```text
deploy/hostinger/ibob-agent-web-hostinger.zip
```

Esse arquivo ZIP e gerado localmente e nao deve ser versionado no Git.

## Gerar pacote

No root do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/build-hostinger-zip.ps1
```

O script copia apenas o app Next.js de `apps/web` para uma pasta temporaria e gera um ZIP com a estrutura esperada pela Hostinger.

Ele cria o ZIP via .NET com caminhos na raiz do arquivo (`package.json`, `src/...`, `public/...`) e permissoes Unix explicitas para evitar erro de permissao no Linux da Hostinger ao acessar pastas como `src/components`.
