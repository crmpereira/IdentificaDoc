document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileUpload');
    const docTypeSelect = document.getElementById('docType');
    const errorMessage = document.getElementById('errorMessage');
    const form = document.getElementById('uploadForm');
    const ocrStatus = document.getElementById('ocrStatus');
    const ocrResult = document.getElementById('ocrResult');
    // const submitButton = form.querySelector('button[type="submit"]'); // Botão removido

    // Palavras-chave para validação
    const KEYWORDS = {
        'CPF': ['CPF', 'MINISTERIO DA FAZENDA', 'RECEITA FEDERAL', 'PESSOA FISICA'],
        'CNH': ['HABILITACAO', 'CNH', 'DETRAN', 'MOTORISTA', 'CARTEIRA NACIONAL', 'PERMISSION'],
        'RG': ['REGISTRO GERAL', 'CARTEIRA DE IDENTIDADE', 'SSP', 'SECRETARIA', 'POLICIA CIVIL', 'IDENTIDADE']
    };

    // Inicialização do Worker do Tesseract (Singleton)
    let worker = null;
    let isWorkerReady = false;

    // Função para inicializar o worker uma única vez
    async function initTesseract() {
        try {
            ocrStatus.textContent = "Carregando motor de reconhecimento...";
            if (fileInput) fileInput.disabled = true; // Desabilita o input enquanto carrega
            
            worker = await Tesseract.createWorker('por');
            
            isWorkerReady = true;
            if (fileInput) fileInput.disabled = false;
            ocrStatus.textContent = ""; // Limpa status inicial
            console.log("Tesseract Worker pronto!");
        } catch (error) {
            console.error("Erro ao inicializar Tesseract:", error);
            ocrStatus.innerHTML = `<span class="validation-error">Erro ao carregar sistema de reconhecimento. Recarregue a página.</span>`;
        }
    }

    // Inicia o carregamento assim que a página abre
    initTesseract();

    // Evento ao selecionar o arquivo
    if (fileInput) {
        fileInput.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            const docType = docTypeSelect.value;
            
            // Limpa mensagens anteriores
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
            ocrStatus.textContent = '';
            ocrResult.style.display = 'none';

            if (!file) return;

            if (!isWorkerReady) {
                alert("Aguarde o sistema de reconhecimento iniciar...");
                fileInput.value = ''; // Limpa seleção
                return;
            }

            // Validação básica de tipo de arquivo
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                errorMessage.style.display = 'block';
                errorMessage.textContent = 'Erro: Apenas arquivos de imagem (JPG, PNG) ou PDF são permitidos.';
                fileInput.value = ''; // Limpa o input
                return;
            }

            // Validação de seleção do tipo de documento
            if (!docType) {
                alert('Por favor, selecione o tipo de documento antes de fazer o upload.');
                this.value = '';
                return;
            }

            ocrStatus.textContent = 'Processando documento... Aguarde.';

            try {
                let text = '';

                if (file.type === 'application/pdf') {
                    text = await extractTextFromPDF(file);
                } else {
                    // Processamento de Imagem com o worker já inicializado
                    const result = await worker.recognize(file);
                    text = result.data.text;
                }

                validateContent(text, docType);
                
            } catch (error) {
                console.error('Erro no OCR:', error);
                ocrStatus.innerHTML = `<span class="validation-error">Erro ao processar o documento. Tente novamente.</span>`;
            } finally {
                // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
                // fileInput.value = ''; 
            }
        });
    }

    // Função para extrair texto de PDF (convertendo para imagem primeiro)
    async function extractTextFromPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';

        // Processa apenas a primeira página para otimização (normalmente suficiente para identificação)
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 melhora a qualidade para OCR
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        // Converte o canvas para imagem (blob) e envia para o Tesseract
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        
        // Usa o worker já inicializado
        const result = await worker.recognize(blob);
        fullText = result.data.text;

        return fullText;
    }

    // Função de validação
    function validateContent(text, docType) {
        const upperText = text.toUpperCase();
        const typeKeywords = KEYWORDS[docType];
        
        // Verifica se pelo menos uma palavra-chave está presente
        const foundKeywords = typeKeywords.filter(keyword => upperText.includes(keyword));
        
        // Não exibe mais o texto extraído
        if (ocrResult) ocrResult.style.display = 'none';

        if (foundKeywords.length > 0) {
            // Documento Encontrado (Válido)
            ocrStatus.innerHTML = `<span class="validation-success">ENCONTRADO</span>`;
        } else {
            // Documento Não Encontrado (Inválido)
            ocrStatus.innerHTML = `<span class="validation-error">NÃO ENCONTRADO</span>`;
        }
    }

    // --- Lógica do Modal do README ---
    const modal = document.getElementById("readmeModal");
    const btnOpen = document.getElementById("btnOpenReadme");
    const spanClose = document.getElementsByClassName("close-modal")[0];
    const readmeContent = document.getElementById("readmeContent");

    // Conteúdo do README embutido para evitar erros de CORS/Fetch
    const README_TEXT = `
# IdentificaDoc - Validação de Documentos com OCR

Este projeto é uma prova de conceito (PoC) para validação automática de documentos (CPF, CNH, RG) utilizando OCR (Reconhecimento Óptico de Caracteres) diretamente no navegador.

O sistema permite que o usuário faça upload de uma imagem ou PDF e verifica se o documento corresponde ao tipo selecionado, procurando por palavras-chave específicas.

## 🚀 Como Funciona

1.  **Seleção do Tipo:** O usuário escolhe o tipo de documento que deseja enviar (CPF, CNH ou RG).
2.  **Upload:** O usuário seleciona um arquivo (Imagem JPG/PNG ou PDF).
3.  **Processamento (OCR):**
    *   O sistema utiliza a biblioteca **Tesseract.js** para ler o texto contido no arquivo.
    *   Se for um PDF, ele é convertido internamente para imagem antes da leitura.
4.  **Validação:** O texto extraído é comparado com um conjunto de palavras-chave pré-definidas para aquele tipo de documento.
5.  **Feedback:** O sistema exibe "ENCONTRADO" (Verde) ou "NÃO ENCONTRADO" (Vermelho).

## 🧠 Lógica de Validação (Keywords)

A validação é baseada na presença de palavras-chave específicas no texto extraído. Essas palavras estão definidas em um objeto \`KEYWORDS\` no arquivo \`script.js\`.

Se **pelo menos uma** das palavras-chave do tipo selecionado for encontrada no documento, ele é considerado válido.

\`\`\`javascript
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
\`\`\`

### Testes
Para teste pode ser criado uma imagem e colocado alguma dessas palavras chave.


### Personalização
Para adicionar novas regras ou tipos de documentos, basta editar este objeto no arquivo \`script.js\`.
NO FUTURO ESSAS PALAVRAS CHAVES DEVEM SER CADASTRAVEIS E QUE FIQUEM COM KEY-USERS O CADASTRO (BANCO DE DADOS)
## ⚡ Otimização de Performance

Para garantir uma boa experiência de usuário, o sistema utiliza um padrão **Singleton** para o motor de OCR:
*   O "Worker" do Tesseract é inicializado apenas uma vez, assim que a página carrega.
*   Isso evita o "recarregamento" pesado da IA a cada novo upload, tornando as validações subsequentes muito mais rápidas.

## 🛠️ Tecnologias Utilizadas

*   **HTML5 & CSS3:** Interface moderna e responsiva.
*   **JavaScript (ES6+):** Lógica de controle e validação.
*   **Tesseract.js (v5):** OCR rodando via WebAssembly no navegador.
*   **PDF.js:** Conversão de arquivos PDF para Canvas/Imagem.
`;

    if (btnOpen) {
        btnOpen.onclick = function() {
            modal.style.display = "block";
            // Renderiza o Markdown usando a biblioteca marked
            if (readmeContent.innerHTML === "Carregando instruções..." || readmeContent.innerHTML.includes("Erro")) {
                readmeContent.innerHTML = marked.parse(README_TEXT);
            }
        }
    }

    if (spanClose) {
        spanClose.onclick = function() {
            modal.style.display = "none";
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});
