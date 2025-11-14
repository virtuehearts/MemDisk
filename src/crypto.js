// Crypto routines for MemDisk
const cryptoLib = require("crypto");

// SHA256 hash
function sha256(data) {
  return cryptoLib.createHash("sha256").update(data).digest("hex");
}

// Generate Bitcoin-style public/private keypair (ECDSA)
function generateKeypair() {
  const { generateKeyPairSync } = require("crypto");
  const { publicKey, privateKey } = generateKeyPairSync("ec", {
    namedCurve: "secp256k1",
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

// Encryption & decryption (AES-256 demo)
function encrypt(data, key) {
  const cipher = cryptoLib.createCipher("aes-256-cbc", key);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(data, key) {
  const decipher = cryptoLib.createDecipher("aes-256-cbc", key);
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { sha256, generateKeypair, encrypt, decrypt };