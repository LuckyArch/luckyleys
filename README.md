<div align="center">

# LUCKY BAILEYS 

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge&logo=npm)
![Node](https://img.shields.io/badge/Node.js-v20%2B-green?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)
![Size](https://img.shields.io/github/repo-size/LuckyArch/luckyleys?style=for-the-badge&color=red)

**Library WhatsApp paling kece, stabil, dan _aesthetic_ buat kalian para _bot developer_ kekinian!**
*Based on Baileys, but make it cool.* 😎

[Fitur](#-fitur-kece) • [Instalasi](#-cara-install) • [Penggunaan](#-cara-pake) • [Troubleshooting](#-kalo-error)

</div>

---

## 👋 Halo Bestie!

Welcome to **LuckyLeys**! Jujurly, ini adalah library WhatsApp yang cocok banget buat kalian yang mau bikin bot WA tapi pengen fitur yang lebih *advanced* dan stabil dari Baileys biasa. Kita udah racik ulang biar lebih enak dipake dan *developer friendly*.

Buat kalian yang mau bikin bot sekeren *LuckyArchz*, wajib banget pake ini! ✨

## 🌟 Fitur Kece

Kenapa harus pake LuckyLeys buat bot kalian?

- 🚀 **Sat Set Wat Wet**: Koneksi cepet, ringan, ga bikin emosi.
- 🛠️ **Custom Handler**: Udah ada `CustomMessageHandler` buat handle pesan-pesan aneh kek *payment*, *product*, *interactive*, dll.
- 🔒 **Secure**: Aman terkendali, privasi terjaga.
- 📱 **Multi-Device Support**: Jelas dong, hari gini ga MD? Rugi dong!
- 🎨 **Aesthetic Logs**: Log-nya bersih dan berwarna, enak diliat pas debugging.

## 📥 Cara Install

Nah, ini bagian paling penting bestie. Karena library ini spesial, cara installnya langsung dari GitHub ya biar dapet update paling *fresh*!

### 1. Siapin Project Kalian
Pastikan kalian udah punya folder project bot dan udah `npm init`. Kalo belum:
```bash
mkdir my-awesome-bot
cd my-awesome-bot
npm init -y
```

### 2. Install LuckyLeys
Langsung aja ketik perintah ini di terminal kalian:

```bash
npm install lucky@github:LuckyArch/luckyleys
```

*Tunggu bentar sampe proses download kelar. Jangan lupa pastiin koneksi internet aman ya!*

### 3. Install Dependencies Tambahan
Biar makin mantap, install juga library pendukungnya:
```bash
npm install @hapi/boom pino qrcode-terminal
```

## 🚀 Cara Pake

Udah kelar install? Mantap! Sekarang saatnya kita coding bot-nya.
Bikin file baru, misalnya `index.js`, terus copas kode ini:

```javascript
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('luckyleys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');

async function startBot() {
    // Siapin auth state biar ga scan QR mulu
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Biar muncul QR di terminal
        logger: pino({ level: 'silent' }), // Biar log ga berisik
        browser: ['LuckyLeys Bot', 'Chrome', '1.0.0']
    });

    // Save creds tiap ada update
    sock.ev.on('creds.update', saveCreds);

    // Handle koneksi
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Yah putus... reconnecting:', shouldReconnect);
            if(shouldReconnect) {
                startBot();
            }
        } else if(connection === 'open') {
            console.log('We are live! 🚀');
        }
    });

    // Handle pesan masuk
    sock.ev.on('messages.upsert', async m => {
        console.log(JSON.stringify(m, undefined, 2));
        
        const msg = m.messages[0];
        if(!msg.key.fromMe && m.type === 'notify') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Halo bestie! Bot aktif nih ✨' });
        }
    });
}

startBot();
```

Jalanin deh:
```bash
node index.js
```

## ❓ Kalo Error...

*Don't panic!* Tarik napas, buang napas. Coba cek beberapa hal ini:

1.  **Node.js Ketinggalan Zaman**: Cek lagi versi Node.js kalian, minimal v20 ya.
2.  **Gagal Install**: Coba `npm cache clean --force` terus install ulang.
3.  **Isu Koneksi**: Pastikan internet kalian lancar jaya.

## 🤝 Credits

Big thanks to:
- **LuckyArchz** (The Mastermind)
- **Baileys** (The OG Library)
- Kalian semua para developer bot kece!

---

<div align="center">

**Made with ❤️ by LuckyArchz**
*Happy Coding!*

</div>
