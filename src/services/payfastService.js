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
    return crypto.createHash("md5").update(getString).digest("hex");
};

const generatePayment = async (orderData) => {
    try {
        // Prepare the data exactly as PayFast expects
        const pfData = {
            merchant_id: '10048075',
            merchant_key: '2z620n2gaivlv',
            return_url: 'http://localhost:3000/orders',
            cancel_url: 'http://localhost:3000/cart',
            name_first: (orderData.customer_name || 'Customer').split(' ')[0],
            name_last: (orderData.customer_name || 'Customer').split(' ').slice(1).join(' ') || 'User',
            email_address: orderData.customer_email || 'customer@love2hug.co.za',
            m_payment_id: orderData.order_number,
            amount: orderData.total.toFixed(2),
            item_name: 'Love2Hug Teddy Bear',
            item_description: `Order ${orderData.order_number}`
        };

        // Generate signature
        const signature = generateSignature(pfData, 'TerryMerius1com');
        
        console.log('Generated signature:', signature);

        // Build the URL manually
        let paymentUrl = 'https://sandbox.payfast.co.za/eng/process?';
        for (const [key, value] of Object.entries(pfData)) {
            paymentUrl += `${key}=${encodeURIComponent(value).replace(/%20/g, '+')}&`;
        }
        paymentUrl += `signature=${signature}`;
        
        console.log('Payment URL:', paymentUrl);
        
        return { success: true, paymentUrl };
    } catch (error) {
        console.error('Generate payment error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { generatePayment, generateSignature };