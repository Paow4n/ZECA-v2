

---

# ZECA ES

**ZECA** es un proyecto en JavaScript que se conecta a la blockchain de Zcash para monitorear transacciones protegidas (*shielded*) recibidas.

Cuando se detecta una transacción, el mensaje contenido en su campo de **memo cifrado** se replica en plataformas externas. La primera integración disponible es con **Discord** (vía bot), pero su diseño modular facilita la extensión a otras plataformas como Telegram, X/Twitter, Matrix o cualquier otro sistema de mensajería.

## Cómo Funciona.

* ZECA se conecta a la red Zcash a través de [Zcash-walletd](https://github.com/james-katz/zcash-walletd) y monitorea una billetera específica en busca de transacciones entrantes.
* Cada transacción Shielded de Zcash puede portar un memo cifrado de **512 bytes** (512 caracteres).
* Tras el descifrado, ZECA extrae el texto del memo.
* El contenido del memo se transmite entonces a una o más plataformas conectadas.
* Con la integración de Discord, por ejemplo, los mensajes aparecen en tiempo real dentro de un canal seleccionado.

---

## Casos de Uso.

* **Denuncias (Whistleblowing):** Zcash permite el envío de transacciones privadas con memos cifrados. Al monitorear una billetera con su clave de visualización, ZECA puede replicar denuncias o pistas anónimas en canales de comunicación, preservando la privacidad del remitente.
* **Mensajería Descentralizada:** Los memos protegidos pueden actuar como un sistema de microblogging resistente a la censura, reflejando el mensaje en plataformas convencionales.
* **Actualizaciones de Comunidad:** DAOs, proyectos o comunidades pueden usar ZECA para distribuir actualizaciones, anuncios o encuestas de forma verificable (prueba on-chain).
* **Experimentación:** Explore cómo el sistema de mensajería basado en blockchain puede conectarse a plataformas ya existentes.

---

## Instrucciones de Instalación.

**NOTA:** Necesitaremos Rust y Node.js para ejecutar ZECA. Esta instalación se realizará en un sistema Linux, aunque puede realizarse en sistemas Windows mediante Docker.
Posteriormente, será necesario el uso de Discord para la configuración y el uso del bot.

### Preparación del Entorno (Se recomienda crear una carpeta nueva para almacenar todo el proyecto).

---

### Instalando Rust.

Rust es necesario para compilar los componentes de bajo nivel presentes en Zcash-walletd.

* En Linux, simplemente ejecute:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

```

---

### Instalando NVM y Node.js.

Recomendamos el uso de **nvm** (Node Version Manager) para gestionar Node.js.

* Linux:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

```

(Reinicie la terminal después de la instalación).

**Instale Node.js LTS:**

```bash
nvm install --lts

```

```bash
nvm use --lts

```

---

### Compilación y Configuración (Build) - (Dentro de la carpeta creada para el proyecto).

1. Clone el backend de la billetera Zcash:

```bash
git clone https://github.com/james-katz/zcash-walletd

```

2. Instale nj-cli (paso único):

```bash
cargo install nj-cli

```

3. **Entre en la carpeta de Zcash-walletd y realice la compilación con nj-cli.**

```bash
cd zcash-walletd/js

```

```bash
nj-cli build --release

```

4. **Regrese a la carpeta del proyecto y clone el repositorio de ZECA.**

```bash
cd ..

```

```bash
git clone https://github.com/Paow4n/ZECA

```

```bash
cd ZECA

```

5. Copie los archivos compilados a la raíz de ZECA.

```bash
cp -r ../zcash-walletd/js/dist ./dist

```

6. Configure las variables de entorno:

```bash
cp sample.env .env

```

Edite el archivo `.env` con sus credenciales y claves. (El token del BOT se obtiene en [Discord developers](https://discord.com/developers/applications); el Channel ID se obtiene en el propio Discord, activando previamente el modo desarrollador en los ajustes. La clave de visualización de la billetera Zcash se puede obtener a través de Zashi siguiendo su tutorial para la obtención de la **UFVK**).

7. **Instale las dependencias y prepare la base de datos.**

```bash
npm install

```

```bash
node sync_db.js

```

8. Inicie el bot:

```bash
node index.js

```

---

Tras seguir estos pasos, si ha configurado correctamente el archivo `.env` e integrado el bot en un servidor donde posea privilegios de administrador, al ejecutar `node index.js` aparecerá información de sincronización (Sync) en la pantalla y el Bot se pondrá en línea.

Una vez que el bot esté en línea, puede usar el comando `/address` para recibir el código QR con la dirección de la billetera configurada mediante la UFVK.

**Importante:** La UFVK es información confidencial de su billetera Zcash y no se mostrará en el bot. El bot mostrará una dirección protegida (*shielded*) vinculada a su UFVK. Cualquier valor transferido a esa dirección llegará a su billetera y la información del memo aparecerá en el bot. Se recomienda configurar una billetera nueva para el bot y **no utilizar su billetera personal**.

---
