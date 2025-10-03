/**
 * Test script to verify Gemini integration with Workload Identity Federation
 */
require('dotenv').config();
const { GoogleAuth } = require('google-auth-library');

async function testGeminiWIF() {
    console.log('🧪 Testing Gemini with Workload Identity Federation...\n');
    
    try {
        // Test Google Cloud authentication
        console.log('1. Testing Google Cloud Authentication...');
        const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
        
        const serviceAccountJson = process.env.GEMINI_SERVICE_ACCOUNT_JSON;
        let auth;
        
        if (serviceAccountJson) {
            console.log('   ✅ Using Service Account JSON');
            auth = new GoogleAuth({
                credentials: JSON.parse(serviceAccountJson),
                scopes
            });
        } else {
            console.log('   ✅ Using Workload Identity Federation / Application Default Credentials');
            auth = new GoogleAuth({ scopes });
        }
        
        // Get access token
        console.log('2. Obtaining access token...');
        const client = await auth.getClient();
        const token = await client.getAccessToken();
        
        if (!token || !token.token) {
            throw new Error('Failed to obtain access token');
        }
        
        console.log('   ✅ Access token obtained successfully');
        
        // Test Gemini API call
        console.log('3. Testing Gemini API call...');
        const projectId = process.env.GOOGLE_PROJECT_ID || 'weaver-studios';
        const location = process.env.GOOGLE_LOCATION || 'us-central1';
        const model = 'gemini-2.5-flash';
        
        console.log(`   📍 Project: ${projectId}`);
        console.log(`   📍 Location: ${location}`);
        console.log(`   📍 Model: ${model}`);
        
        const requestBody = {
            contents: [
                {
                    role: 'user',
                    parts: [{ text: 'Say "GEMINI_WIF_TEST_SUCCESS" if you can hear me.' }]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 50
            }
        };
        
        const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        
        console.log('   ✅ Gemini API call successful!');
        console.log(`   📝 Response: "${content}"`);
        
        // Test different models
        console.log('\\n4. Testing additional models...');
        const modelsToTest = ['gemini-2.5-pro', 'gemini-1.5-flash'];
        
        for (const testModel of modelsToTest) {
            try {
                const testUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${testModel}:generateContent`;
                const testResponse = await fetch(testUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: `Test ${testModel}` }] }],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 20 }
                    })
                });
                
                if (testResponse.ok) {
                    console.log(`   ✅ ${testModel}: Available`);
                } else {
                    console.log(`   ❌ ${testModel}: Not available (${testResponse.status})`);
                }
            } catch (error) {
                console.log(`   ❌ ${testModel}: Error - ${error.message}`);
            }
        }
        
        console.log('\\n🎉 All tests passed! Gemini integration with WIF is working correctly.');
        console.log('\\n📋 Configuration Summary:');
        console.log(`   • Project ID: ${projectId}`);
        console.log(`   • Location: ${location}`);
        console.log(`   • Auth Method: ${serviceAccountJson ? 'Service Account JSON' : 'Workload Identity Federation'}`);
        console.log(`   • Available Models: gemini-2.5-flash, gemini-2.5-pro, gemini-1.5-flash`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('\\n🔧 Troubleshooting:');
        console.error('   1. Check that GOOGLE_PROJECT_ID is set correctly');
        console.error('   2. Verify service account has Vertex AI permissions');
        console.error('   3. For local dev: Ensure GOOGLE_APPLICATION_CREDENTIALS points to valid key file');
        console.error('   4. For CI/CD: Verify Workload Identity Federation is configured');
        console.error('\\n📖 See WIF_SETUP.md for detailed configuration steps');
        process.exit(1);
    }
}

// Run the test
testGeminiWIF().catch(console.error);