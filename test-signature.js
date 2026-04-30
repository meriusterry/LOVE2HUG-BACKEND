const crypto = require("crypto");

const generateSignature = (data, passPhrase = null) => {
    let pfOutput = "";
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            if (data[key] !== "") {
                pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, "+")}&`;
            }
        }
    }
    let getString = pfOutput.slice(0, -1);
    if (passPhrase !== null) {
        getString += `&passphrase=${encodeURIComponent(passPhrase.trim()).replace(/%20/g, "+")}`;
    }
    console.log('String to hash:', getString);
    return crypto.createHash("md5").update(getString).digest("hex");
};

// Test with your credentials
const testData = {
    merchant_id: '10048075',
    merchant_key: '2z620n2gaivlv',
    return_url: 'http://localhost:3000/orders',
    cancel_url: 'http://localhost:3000/cart',
    name_first: 'Test',
    name_last: 'User',
    email_address: 'test@example.com',
    m_payment_id: 'TEST-ORDER-001',
    amount: '100.00',
    item_name: 'Test Product',
    item_description: 'Test Order'
};

const signature = generateSignature(testData, 'TerryMerius1com');
console.log('Generated signature:', signature);