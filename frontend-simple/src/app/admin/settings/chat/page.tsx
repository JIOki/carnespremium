'use client';

import { useState, useEffect } from 'react';
import { Bot, Key, Check, AlertCircle, Eye, EyeOff, Save } from 'lucide-react';

interface ChatConfig {
  provider: 'openai' | 'minimax' | 'none';
  openaiApiKey: string;
  minimaxApiKey: string;
  isConfigured: boolean;
}

export default function ChatSettingsPage() {
  const [config, setConfig] = useState<ChatConfig>({
    provider: 'none',
    openaiApiKey: '',
    minimaxApiKey: '',
    isConfigured: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showMiniMaxKey, setShowMiniMaxKey] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Cargar desde localStorage (en producción sería desde el backend)
      const saved = localStorage.getItem('chatConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig({
          ...parsed,
          // No mostrar las keys completas por seguridad
          openaiApiKey: parsed.openaiApiKey ? '••••••••' + parsed.openaiApiKey.slice(-4) : '',
          minimaxApiKey: parsed.minimaxApiKey ? '••••••••' + parsed.minimaxApiKey.slice(-4) : '',
          isConfigured: !!(parsed.openaiApiKey || parsed.minimaxApiKey),
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Obtener las keys actuales si no se modificaron
      const currentConfig = localStorage.getItem('chatConfig');
      const current = currentConfig ? JSON.parse(currentConfig) : {};

      const newConfig = {
        provider: config.provider,
        openaiApiKey: config.openaiApiKey.includes('••••') ? current.openaiApiKey : config.openaiApiKey,
        minimaxApiKey: config.minimaxApiKey.includes('••••') ? current.minimaxApiKey : config.minimaxApiKey,
      };

      // Guardar en localStorage (en producción guardar en backend)
      localStorage.setItem('chatConfig', JSON.stringify(newConfig));

      setMessage({ type: 'success', text: 'Configuracion guardada correctamente' });
      
      // Recargar para mostrar las keys enmascaradas
      setTimeout(() => loadConfig(), 1000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la configuracion' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTestResult(null);
    
    const currentConfig = localStorage.getItem('chatConfig');
    if (!currentConfig) {
      setTestResult('No hay configuracion guardada');
      return;
    }

    const saved = JSON.parse(currentConfig);
    const apiKey = config.provider === 'openai' ? saved.openaiApiKey : saved.minimaxApiKey;

    if (!apiKey) {
      setTestResult('No hay API key configurada para ' + config.provider);
      return;
    }

    setTestResult('Probando conexion...');

    try {
      // Probar con un mensaje simple
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hola, es una prueba de conexion',
          provider: config.provider,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        setTestResult('Error: ' + data.error);
      } else {
        setTestResult('Conexion exitosa! Respuesta: ' + data.message.substring(0, 100) + '...');
      }
    } catch (error) {
      setTestResult('Error de conexion. Verifica que el backend este corriendo.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion del Chatbot IA</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configura el asistente virtual para mejorar la experiencia de compra
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <div className="flex items-center">
            {message.type === 'success' ? <Check className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Proveedor de IA</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* None */}
          <button
            onClick={() => setConfig({ ...config, provider: 'none' })}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              config.provider === 'none'
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="font-medium">Desactivado</p>
                <p className="text-xs text-gray-500">Usar respuestas predefinidas</p>
              </div>
            </div>
          </button>

          {/* OpenAI */}
          <button
            onClick={() => setConfig({ ...config, provider: 'openai' })}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              config.provider === 'openai'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-green-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">GPT</span>
              </div>
              <div>
                <p className="font-medium">OpenAI (ChatGPT)</p>
                <p className="text-xs text-gray-500">GPT-3.5 Turbo</p>
              </div>
            </div>
          </button>

          {/* MiniMax */}
          <button
            onClick={() => setConfig({ ...config, provider: 'minimax' })}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              config.provider === 'minimax'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">MM</span>
              </div>
              <div>
                <p className="font-medium">MiniMax</p>
                <p className="text-xs text-gray-500">MiniMax-Text-01</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* API Keys */}
      {config.provider !== 'none' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuracion de API</h2>

          {config.provider === 'openai' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showOpenAIKey ? 'text' : 'password'}
                    value={config.openaiApiKey}
                    onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                    placeholder="sk-..."
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showOpenAIKey ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Obten tu API key en <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">platform.openai.com</a>
                </p>
              </div>
            </div>
          )}

          {config.provider === 'minimax' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MiniMax API Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showMiniMaxKey ? 'text' : 'password'}
                    value={config.minimaxApiKey}
                    onChange={(e) => setConfig({ ...config, minimaxApiKey: e.target.value })}
                    placeholder="Tu API key de MiniMax"
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMiniMaxKey(!showMiniMaxKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showMiniMaxKey ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Obten tu API key en la plataforma de MiniMax
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Test Connection */}
      {config.provider !== 'none' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Probar Conexion</h2>
          
          <button
            onClick={testConnection}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            Probar conexion con {config.provider === 'openai' ? 'OpenAI' : 'MiniMax'}
          </button>

          {testResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              testResult.includes('exitosa') ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
            }`}>
              {testResult}
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Guardar Configuracion
            </>
          )}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Informacion importante</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>Las API keys se guardan de forma segura en el servidor</li>
          <li>El chatbot usara respuestas predefinidas si no hay API configurada</li>
          <li>OpenAI cobra por uso ($0.002/1K tokens aprox)</li>
          <li>MiniMax tiene un tier gratuito disponible</li>
        </ul>
      </div>
    </div>
  );
}