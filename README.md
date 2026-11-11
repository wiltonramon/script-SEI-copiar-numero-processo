# SEI TRE-CE | Copiar número do processo

Script para Tampermonkey que adiciona um botão de copiar ao lado do número do processo na árvore do SEI do TRE-CE. O botão copia o número exibido na tela, com a formatação original.

## Instalação

1. Instale a extensão Tampermonkey no navegador.
2. Abra a [página do script no Greasy Fork](https://greasyfork.org/pt-BR/scripts/597832) e instale o script. Para usar diretamente o código deste repositório, abra o [arquivo .user.js](https://raw.githubusercontent.com/wiltonramon/script-SEI-copiar-numero-processo/main/sei-copiar-numero-processo.user.js).
3. Abra ou recarregue um processo no SEI do TRE-CE.

## Uso

Clique no ícone de copiar ao lado do número do processo. Também é possível selecionar o ícone com **Tab** e acioná-lo com **Enter** ou **Espaço**.

O aviso aparece abaixo do botão por **2 segundos**. Ele fica **verde** quando a cópia é concluída e **vermelho** quando o navegador não permite copiar.

O script roda na árvore do processo em `sei.tre-ce.jus.br`. A cópia é feita localmente, sem envio do número do processo a serviços externos.

## Espelhamento no Greasy Fork

Use o arquivo abaixo como fonte de sincronização na página de edição do script no Greasy Fork:

```text
https://raw.githubusercontent.com/wiltonramon/script-SEI-copiar-numero-processo/main/sei-copiar-numero-processo.user.js
```

Para publicar uma nova versão, aumente o valor de `@version` no cabeçalho, envie o arquivo atualizado para a branch `main` e sincronize o script no Greasy Fork.

## Licença

MIT.
