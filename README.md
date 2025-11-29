<div align="center">

# 🍀 LuckyLeys 🍀

![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge&logo=npm)
![Node](https://img.shields.io/badge/Node.js-v20%2B-green?style=for-the-badge&logo=node.js)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)
![Size](https://img.shields.io/github/repo-size/LuckyArchz/WaBails?style=for-the-badge&color=red)

**Library WhatsApp paling kece, stabil, dan _aesthetic_ buat kalian para _developer_ kekinian!**
*Based on Baileys, but make it cool.* 😎

[Fitur](#-fitur-kece) • [Instalasi](#-cara-install) • [Penggunaan](#-cara-pake) • [Troubleshooting](#-kalo-error)

</div>

---

## 👋 Halo Bestie!

Welcome to **LuckyLeys**! Jujurly, ini adalah library WhatsApp bot yang udah kita racik ulang biar makin enak dipake, makin stabil, dan pastinya *developer friendly* banget. Buat kalian yang mau bikin bot WA tapi gamau ribet sama kode yang *spaghetti*, LuckyLeys is the answer! ✨

Kita udah benerin banyak hal, nambahin fitur-fitur keren, dan ngerapihin kodenya biar mata kalian dimanjakan. *So, let's get started!*

## 🌟 Fitur Kece

Kenapa harus pake LuckyLeys? Nih alasannya:

- 🚀 **Sat Set Wat Wet**: Koneksi cepet, ringan, ga bikin emosi.
- 🎨 **Aesthetic Code**: Struktur kodenya rapih, enak dibaca, ga bikin pusing.
- 🛠️ **Custom Handler**: Udah ada `CustomMessageHandler` buat handle pesan-pesan aneh kek *payment*, *product*, *interactive*, dll.
- 🔒 **Secure**: Aman terkendali, privasi terjaga.
- 📱 **Multi-Device Support**: Jelas dong, hari gini ga MD? Rugi dong!
- 🤖 **Smart Logger**: Log-nya bersih, informatif, dan berwarna (pake `chalk` dong).

## 📥 Cara Install

Oke bestie, simak baik-baik ya langkah-langkahnya. Gampang kok, ga sampe 5 menit!

### 1. Siapin Bahannya
Pastikan di laptop/PC kalian udah terinstall **Node.js** versi **20** ke atas ya. Kalo belum, update dulu gih!
Cek versi node kalian:
```bash
node -v
```
*Kalo munculnya v20.x.x atau lebih baru, berarti aman!*

### 2. Clone Repo Ini
Buka terminal kesayangan kalian (Git Bash, CMD, PowerShell, terserah), terus ketik mantra ini:
```bash
git clone https://github.com/LuckyArchz/WaBails.git luckyleys
```
*Tunggu bentar sampe download-nya kelar.*

### 3. Masuk ke Folder
Jalan-jalan dulu ke folder yang barusan di-clone:
```bash
cd luckyleys
```

### 4. Install Dependencies
Biar si LuckyLeys bisa jalan, dia butuh temen-temennya. Install dulu pake npm atau yarn:
```bash
npm install
# atau kalo kalian tim yarn:
yarn install
```
*Sambil nunggu, bisa lah nyeduh kopi atau scroll TikTok bentar.* ☕

## 🚀 Cara Pake

Udah kelar install? Mantap! Sekarang saatnya kita nyalain mesinnya.

### Start Basic
Buat jalanin bot-nya, cukup ketik:
```bash
npm start
```

### Coding Time!
Kalo mau pake library ini di kode kalian, caranya gampang banget:

```javascript
const { makeWASocket, useMultiFileAuthState } = require('./lib/index');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // Biar muncul QR di terminal
        // Konfigurasi lain sesuka hati kalian
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            console.log('Yah putus... reconnecting ya bestie!');
            startBot(); // Gas connect lagi
        } else if(connection === 'open') {
            console.log('We are live! 🚀');
        }
    });
}

startBot();
```

## ❓ Kalo Error...

*Don't panic!* Tarik napas, buang napas. Coba cek beberapa hal ini:

1.  **Node.js Ketinggalan Zaman**: Cek lagi versi Node.js kalian, minimal v20 ya.
2.  **Module Ilang**: Coba hapus folder `node_modules` terus `npm install` lagi. Kadang suka *corrupt* emang.
3.  **Koneksi Lemot**: Pastikan internet kalian lancar jaya.
4.  **Masih Error?**: Cek `issue` di repo atau tanya Mbah Google.

## 🤝 Credits

Big thanks to:
- **LuckyArchz** (The Mastermind behind LuckyLeys)
- **Baileys** (The OG Library)
- Kalian semua yang udah pake library ini!

---

<div align="center">

**Made with ❤️ by LuckyArchz**
*Happy Coding!*

</div>
