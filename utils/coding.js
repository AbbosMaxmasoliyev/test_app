const zlib = require('zlib');
const msgpack = require('msgpack-lite');



// JSON obyektni oddiy `JSON.stringify` orqali stringga aylantirish va Base64 formatga o‘tkazish
function encodeBase64(jsonObject) {
    const jsonString = JSON.stringify(jsonObject);
    return Buffer.from(jsonString).toString('base64');
}

function decodeBase64(base64String) {
    const jsonString = Buffer.from(base64String, 'base64').toString('utf-8');
    return JSON.parse(jsonString);
}

function encodeGzipBase64(jsonObject) {
    const jsonString = JSON.stringify(jsonObject);
    return new Promise((resolve, reject) => {
        zlib.gzip(jsonString, (err, buffer) => {
            if (err) reject(err);
            else resolve(buffer.toString('base64'));
        });
    });
}

function decodeGzipBase64(base64String) {
    const compressedBuffer = Buffer.from(base64String, 'base64');
    return new Promise((resolve, reject) => {
        zlib.gunzip(compressedBuffer, (err, buffer) => {
            if (err) reject(err);
            else resolve(JSON.parse(buffer.toString()));
        });
    });
}

// JSON obyektni `msgpack-lite` bilan siqish va Base64 ga o‘tkazish
function encodeMsgpackBase64(jsonObject) {
    const packedData = msgpack.encode(jsonObject);
    return packedData.toString('base64');
}

function decodeMsgpackBase64(base64String) {
    const buffer = Buffer.from(base64String, 'base64');
    return msgpack.decode(buffer);
}

// Test qilish uchun funksiyalar
async function testEncodings(data) {
    console.log("Original JSON:", data);

    // 1. Base64 kodlash va dekodlash
    const base64Encoded = encodeBase64(data);
    console.log("Base64 Encoded:", base64Encoded);
    const base64Decoded = decodeBase64(base64Encoded);
    console.log("Base64 Decoded:", base64Decoded);

    // 2. Gzip + Base64 kodlash va dekodlash
    const gzipEncoded = await encodeGzipBase64(data);
    console.log("Gzip + Base64 Encoded:", gzipEncoded);
    const gzipDecoded = await decodeGzipBase64(gzipEncoded);
    console.log("Gzip + Base64 Decoded:", gzipDecoded);

    // 3. Msgpack + Base64 kodlash va dekodlash
    const msgpackEncoded = encodeMsgpackBase64(data);
    console.log("Msgpack + Base64 Encoded:", msgpackEncoded);
    const msgpackDecoded = decodeMsgpackBase64(msgpackEncoded);
    console.log("Msgpack + Base64 Decoded:", msgpackDecoded);
}
module.exports = { testEncodings, encodeMsgpackBase64, decodeMsgpackBase64 }
