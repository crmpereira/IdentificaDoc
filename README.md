# IdentificaDoc - Validação de Documentos com OCR

Este projeto é uma prova de conceito (PoC) para validação automática de documentos (CPF, CNH, RG) utilizando OCR (Reconhecimento Óptico de Caracteres) diretamente no navegador.

O sistema permite que o usuário faça upload de uma imagem ou PDF e verifica se o documento corresponde ao tipo selecionado, procurando por palavras-chave específicas.

## � Imagens do Projeto

### Interface Inicial
*(Adicione aqui um print da tela inicial do projeto)*
![Tela Inicial](screenshots/interface_inicial.png)

### Exemplo de Documento Aceito
![Exemplo de Documento](screenshots/exemplo_documento.jpg)

## �🚀 Como Funciona

1.  **Seleção do Tipo:** O usuário escolhe o tipo de documento que deseja enviar (CPF, CNH ou RG).
2.  **Upload:** O usuário seleciona um arquivo (Imagem JPG/PNG ou PDF).
3.  **Processamento (OCR):**
    *   O sistema utiliza a biblioteca **Tesseract.js** para ler o texto contido no arquivo.
    *   Se for um PDF, ele é convertido internamente para imagem antes da leitura.
4.  **Validação:** O texto extraído é comparado com um conjunto de palavras-chave pré-definidas para aquele tipo de documento.
5.  **Feedback:** O sistema exibe "ENCONTRADO" (Verde) ou "NÃO ENCONTRADO" (Vermelho).

## 🧠 Lógica de Validação (Keywords)

A validação é baseada na presença de palavras-chave específicas no texto extraído. Essas palavras estão definidas em um objeto `KEYWORDS` no arquivo `script.js`.

Se **pelo menos uma** das palavras-chave do tipo selecionado for encontrada no documento, ele é considerado válido.

```javascript
const KEYWORDS = {
    'CPF': [
        'CPF', 
        'MINISTERIO DA FAZENDA', 
        'RECEITA FEDERAL', 
        'PESSOA FISICA'
    ],
    'CNH': [
        'HABILITACAO', 
        'CNH', 
        'DETRAN', 
        'MOTORISTA', 
        'CARTEIRA NACIONAL', 
        'PERMISSION'
    ],
    'RG': [
        'REGISTRO GERAL', 
        'CARTEIRA DE IDENTIDADE', 
        'SSP', 
        'SECRETARIA', 
        'POLICIA CIVIL', 
        'IDENTIDADE'
    ]
};
```

### Personalização
Para adicionar novas regras ou tipos de documentos, basta editar este objeto no arquivo `script.js`.

## ⚡ Otimização de Performance

Para garantir uma boa experiência de usuário, o sistema utiliza um padrão **Singleton** para o motor de OCR:
*   O "Worker" do Tesseract é inicializado apenas uma vez, assim que a página carrega.
*   Isso evita o "recarregamento" pesado da IA a cada novo upload, tornando as validações subsequentes muito mais rápidas.

## 🛠️ Tecnologias Utilizadas

*   **HTML5 & CSS3:** Interface moderna e responsiva.
*   **JavaScript (ES6+):** Lógica de controle e validação.
*   **Tesseract.js (v5):** OCR rodando via WebAssembly no navegador.
*   **PDF.js:** Conversão de arquivos PDF para Canvas/Imagem.

## 📦 Como Executar

Basta abrir o arquivo `index.html` em um navegador moderno.
Para melhor performance e evitar bloqueios de segurança (CORS) com o Web Worker, recomenda-se usar um servidor local simples, como o `live-server` ou `http-server` do Node.js, ou a extensão Live Server do VS Code.
