// Diagnostic script to test the production API login endpoint
const email = 'hmesag@gmail.com';
const passwords = ['TEST_PASSWORD_HERE'];
const url = 'http://api-grupomv-vthrd-31.97.100.82.sslip.io/api/auth/login';

console.log('🚀 Test: Testing production login with multiple credentials...');

async function testPassword(password) {
    console.log(`\n🔑 Testing password: "${password}"...`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        console.log('📊 Status:', res.status, res.statusText);
        const data = await res.json().catch(() => ({}));
        console.log('📦 Body:', data);
        if (res.status === 200) {
            console.log('✅ SUCCESS!');
            return true;
        }
    } catch (err) {
        console.error('❌ Request Failed:', err.message);
    }
    return false;
}

async function run() {
    for (const pwd of passwords) {
        const success = await testPassword(pwd);
        if (success) {
            console.log(`\n🎉 The correct password is: "${pwd}"`);
            return;
        }
    }
    console.log('\n❌ None of the standard passwords worked!');
}

run();

run();
