const express = require('express');
const axios = require('axios');
const router = express.Router();

const { HttpsProxyAgent } = require('https-proxy-agent');

const proxyAgent = new HttpsProxyAgent('http://10.8.77.250:3124');

const SYSTEM_PROMPT = `Eres el asistente virtual de "Carnes Premium", una tienda en linea especializada en cortes de carne de alta calidad en Mexico.
- Amigable y profesional
- Experto en carnes y cortes
- Responde en espanol, maximo 3 parrafos
- Usa emojis ocasionalmente`;

// POST /api/chat
router.post('/', async (req, res) => {
    try {
        const { message, history = [], provider = 'openai' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.slice(-10),
            { role: 'user', content: message },
        ];

        const response = await axios.post(
            
            'https://api.openai.com/v1/chat/completions',
            { model: 'gpt-3.5-turbo', messages, max_tokens: 500 },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
                
            }
            
        );

        const botMessage = response.data.choices[0]?.message?.content || 'Lo siento, no pude procesar tu mensaje.';
        return res.json({ message: botMessage, provider: 'openai' });

    } catch (error) {
        console.log('API Key loaded:', !!process.env.OPENAI_API_KEY);
        console.error('Chat API Error:', error.response?.data || error.message);
        return res.json({
            message: 'Disculpa, estoy teniendo problemas tecnicos.',
            provider: 'fallback',
            error: true,
        });
    }
});

// GET /api/chat/status
router.get('/status', (req, res) => {
    res.json({
        openai: !!process.env.OPENAI_API_KEY,
        minimax: !!process.env.MINIMAX_API_KEY,
    });
});

module.exports = router;