

---

# ZECA PT/BR

O **ZECA** é um projeto em JavaScript que se conecta à blockchain Zcash para monitorar transações protegidas (*shielded*) recebidas.

Quando uma transação é detectada, a mensagem contida no seu campo de **memo criptografado** é replicada para plataformas externas. A primeira integração disponível é com o **Discord** (via bot), mas o design modular facilita a extensão para outras plataformas como Telegram, X/Twitter, Matrix ou qualquer outro sistema de mensagens.

## Como Funciona.

- O ZECA se conecta à rede Zcash via [Zcash-walletd](https://github.com/james-katz/zcash-walletd) e monitora uma carteira específica em busca de transações recebidas.
- Cada transação Shielded da Zcash pode carregar um memo criptografado de **512 bytes** (512 caracteres).
- Após a descriptografia, o ZECA extrai o texto do memo.
- O conteúdo do memo é então transmitido para uma ou mais plataformas conectadas.
- Com a integração do Discord, por exemplo, as mensagens aparecem em tempo real dentro de um canal selecionado.

---

## Casos de Uso.

- **Denúncias (Whistleblowing):** A Zcash permite o envio de transações privadas com memos criptografados. Ao monitorar uma carteira com a sua chave de visualização, o ZECA pode replicar denúncias ou dicas anônimas para canais de comunicação, preservando a privacidade do remetente.
- **Mensagens Descentralizadas:** Memos protegidos podem atuar como um sistema de microblogging resistente à censura, espelhando a mensagem em plataformas convencionais.
- **Atualizações de Comunidade:** DAOs, projetos ou comunidades podem usar o ZECA para distribuir atualizações, anúncios ou enquetes de forma verificável (prova on-chain).
- **Experimentação:** Explore como o sistema de mensagens baseado em blockchain pode se conectar a plataformas já existentes.

---

Instruções de Instalação.

OBS: Iremos precisar do Rust e do Node.js para rodar o Zeca, esta instalação será realizada em sistema Linux, podendo ser realizada em sistemas Windows com Docker. 
Posteriormente, será necessário o uso do Discord para configuração e uso do bot. 

### Preparação do Ambiente (Recomendo criar uma nova pasta para armazenar todo o projeto).

---

### Instalando o Rust.

O Rust é necessário para compilar os componentes de baixo nível presentes na Zcash-walletd.

- No Linux, basta rodar:
    
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
    

---

### Instalando o NVM e Node.js.

Recomendamos o uso do **nvm** (Node Version Manager) para gerenciar o Node.js.

- Linux
    
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```
    

(Reinicie o terminal após a instalação).

**Instale o Node.js LTS:**

```bash
nvm install --lts
```

```bash
nvm use --lts
```

---

### Compilação e Configuração (Build) - (Dentro da nova pasta que foi criada para o projeto).

1. Clone o backend da carteira Zcash:
    
```bash
git clone https://github.com/james-katz/zcash-walletd
```
    
2. Instale o nj-cli (etapa única):
    
```bash
cargo install nj-cli
```
    
3. **Entre na pasta da Zcash-walletd e faça o build com o nj-cli.**
    
```bash
cd zcash-walletd/js
```
    
```bash
nj-cli build --release
```
    
4. **Retorne para a pasta do projeto e clone o repositório do ZECA.**
    
```bash
cd ../..
```
    
```bash
git clone https://github.com/Paow4n/ZECA-v2.git
```
    
```bash
cd ZECA-v2
```
    
5. Copie os arquivos compilados para a raiz do ZECA.
    
```bash
cp -r ../zcash-walletd/js/dist ./dist
```
    
6. Configure as variáveis de ambiente:
    
```bash
cp sample.env .env
```
    
Edite o arquivo .env com suas credenciais e chaves. (O token do BOT você consegue pegar em [Discord developers](https://discord.com/developers/applications) o Channel ID você consegue pegar no próprio discord, será necessário entrar nas configurações e ativar modo desenvolvedor. A chave de visualização da carteira da Zcash, você consegue através da Zashi por este Tutorial de obtenção de UFVK.) 
    
7. **Instale as dependências e prepare o banco de dados.**
    
```bash
npm install
```
    
```bash
node sync_db.js
```
    
8. Inicie o bot:
    
```bash
node index.js
```
    

Após esse passo a passo, caso tenha configurado o .env corretamente e inserido o bot em um servidor que você possua privilégios de administrador, quando você rodar o comando `node index.js` no terminal, irá surgir informações na tela de Sync e o Bot ficará online, a partir do momento que o bot estiver Online, pode usar o comando `/address` para receber o QRCode com o endereço da carteira que configuramos na UFVK. 

O UFVK é uma informação sigilosa da sua carteira Zcash, ela não estará sendo exibida no bot, o bot irá exibir um endereço shielded da sua UFVK, qualquer valor transferido para esse endereço, irá para a sua carteira e as informações serão exibidas no Bot. Recomendo que configure uma carteira nova para utilizar no Bot e não utilize a sua carteira pessoal.
