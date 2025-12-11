'use client';

import { useState, useRef, useEffect, useContext } from 'react';
import { MessageCircle, X, Send, Bot, User, Settings } from 'lucide-react';
import Link from 'next/link';

// Hook seguro que no lanza error si no hay AuthProvider
function useAuthSafe() {
  const [authState, setAuthState] = useState<{ user: any; isAuthenticated: boolean }>({
    user: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token') || localStorage.getItem('auth-token');
       if (savedUser && savedToken) {
        const user = JSON.parse(savedUser);
        setAuthState({ user, isAuthenticated: true });
      }
    } catch {
      // Ignorar errores
    }
  }, []);

  return authState;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatConfig {
  provider: 'openai' | 'minimax' | 'none';
  openaiApiKey?: string;
  minimaxApiKey?: string;
}

const QUICK_REPLIES = [
  '¿Cual es el mejor corte para asar?',
  '¿Tienen envio gratis?',
  '¿Como preparo un ribeye?',
  'Recomiendame un corte',
];

const MEAT_KNOWLEDGE: Record<string, string> = {
  'ribeye': 'El **Ribeye** es uno de los cortes mas jugosos y sabrosos. Tiene excelente marmoleo (grasa intramuscular) que le da sabor. Ideal para la parrilla a fuego alto, 3-4 min por lado para termino medio.',
  'arrachera': 'La **Arrachera** es perfecta para tacos y fajitas. Marinala por al menos 2 horas y cocinala a fuego alto por 3-4 minutos por lado. Cortala en contra de la fibra.',
  'new york': 'El **New York** o Strip tiene menos grasa que el ribeye pero es muy tierno. Perfecto para parrilla, sazona con sal gruesa y pimienta antes de cocinar.',
  't-bone': 'El **T-Bone** incluye dos cortes: el filete y el New York, separados por un hueso en forma de T. Ideal para parrilla, cocina primero el lado del filete.',
  'filete': 'El **Filete Mignon** es el corte mas tierno. Tiene poca grasa asi que no lo cocines de mas. Ideal termino medio-rojo.',
  'asado': 'Para **asar** recomiendo: Ribeye (jugoso), Arrachera (para tacos), T-Bone (dos cortes en uno), o New York (balance perfecto).',
  'envio': 'Ofrecemos **envio gratis** en pedidos mayores a $999 MXN. Los pedidos se entregan en 24-48 horas con empaque refrigerado para mantener la cadena de frio.',
  'preparar': 'Tips generales: 1) Saca la carne del refri 30 min antes, 2) Seca bien la superficie, 3) Sazona justo antes de cocinar, 4) Deja reposar 5 min despues de cocinar.',
  'recomendar': '¿Para que ocasion buscas?\n\n- **Parrillada familiar**: Arrachera o Ribeye\n- **Cena romantica**: Filete Mignon\n- **Tacos/Fajitas**: Arrachera marinada\n- **Impresionar invitados**: T-Bone o Tomahawk',
  'precio': 'Los precios varian segun el corte y peso. Visita nuestra seccion de productos para ver precios actualizados. Tenemos ofertas especiales para miembros!',
  'membresia': 'Nuestra **membresia premium** incluye: 10% descuento en todos los productos, envio gratis siempre, acceso a cortes exclusivos y puntos dobles en cada compra.',
};

function getLocalBotResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('hola') || msg.includes('buenos') || msg.includes('hi')) {
    return 'Hola! Soy el asistente de Carnes Premium. ¿En que puedo ayudarte hoy? Puedo recomendarte cortes, explicarte como prepararlos o ayudarte con tu pedido.';
  }
  
  for (const [key, response] of Object.entries(MEAT_KNOWLEDGE)) {
    if (msg.includes(key)) {
      return response;
    }
  }
  
  if (msg.includes('asar') || msg.includes('parrilla') || msg.includes('grill')) {
    return MEAT_KNOWLEDGE['asado'];
  }
  
  if (msg.includes('envio') || msg.includes('entrega') || msg.includes('gratis')) {
    return MEAT_KNOWLEDGE['envio'];
  }
  
  if (msg.includes('preparar') || msg.includes('cocinar') || msg.includes('hacer') || msg.includes('como')) {
    return MEAT_KNOWLEDGE['preparar'];
  }
  
  if (msg.includes('recomienda') || msg.includes('sugieres') || msg.includes('mejor') || msg.includes('cual')) {
    return MEAT_KNOWLEDGE['recomendar'];
  }
  
  if (msg.includes('precio') || msg.includes('cuesta') || msg.includes('cuanto') || msg.includes('valor')) {
    return MEAT_KNOWLEDGE['precio'];
  }
  
  if (msg.includes('membresia') || msg.includes('premium') || msg.includes('beneficio')) {
    return MEAT_KNOWLEDGE['membresia'];
  }
  
  if (msg.includes('gracias') || msg.includes('thanks')) {
    return 'Con gusto! Si tienes mas preguntas sobre nuestros cortes o necesitas ayuda con tu pedido, aqui estoy.';
  }
  
  if (msg.includes('adios') || msg.includes('bye') || msg.includes('chao')) {
    return 'Hasta pronto! Gracias por visitar Carnes Premium. Que disfrutes tu asado!';
  }
  
  return 'Interesante pregunta. Puedo ayudarte con:\n\n- Informacion sobre cortes de carne\n- Recomendaciones segun la ocasion\n- Tips de preparacion\n- Informacion de envios\n- Detalles de membresia\n\n¿Sobre que te gustaria saber mas?';
}

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuthSafe();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hola! Soy tu asistente de Carnes Premium. ¿En que puedo ayudarte hoy?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatConfig, setChatConfig] = useState<ChatConfig>({ provider: 'none' });
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Verificar si el usuario actual es administrador
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';

  useEffect(() => {
    const saved = localStorage.getItem('chatConfig');
    if (saved) {
      setChatConfig(JSON.parse(saved));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callAIAPI = async (message: string): Promise<string> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: chatHistory,
          provider: chatConfig.provider,
        }),
      });

      const data = await response.json();
      
      if (data.error && !data.message) {
        throw new Error(data.error);
      }
      
      return data.message;
    } catch (error) {
      console.error('AI API Error:', error);
      return getLocalBotResponse(message);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    setChatHistory((prev) => [...prev, { role: 'user', content: messageText }]);

    setIsTyping(true);

    let botResponse: string;

    if (chatConfig.provider !== 'none' && (chatConfig.openaiApiKey || chatConfig.minimaxApiKey)) {
      botResponse = await callAIAPI(messageText);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
      botResponse = getLocalBotResponse(messageText);
    }

    setIsTyping(false);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
    setChatHistory((prev) => [...prev, { role: 'assistant', content: botResponse }]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-gray-600 rotate-90' : 'bg-red-600 hover:bg-red-700 hover:scale-110'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Asistente Premium</h3>
                  <p className="text-xs text-red-100">
                    {chatConfig.provider !== 'none' ? `IA: ${chatConfig.provider}` : 'Tu experto en carnes'}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <Link
                  href="/admin/settings/chat"
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  title="Configurar chatbot"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  >
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-red-600 text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-2 border-t border-gray-100 bg-white">
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((reply, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(reply)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}







/*'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatConfig {
  provider: 'openai' | 'minimax' | 'none';
  openaiApiKey?: string;
  minimaxApiKey?: string;
}

const QUICK_REPLIES = [
  '¿Cual es el mejor corte para asar?',
  '¿Tienen envio gratis?',
  '¿Como preparo un ribeye?',
  'Recomiendame un corte',
];

const MEAT_KNOWLEDGE: Record<string, string> = {
  'ribeye': 'El **Ribeye** es uno de los cortes mas jugosos y sabrosos. Tiene excelente marmoleo (grasa intramuscular) que le da sabor. Ideal para la parrilla a fuego alto, 3-4 min por lado para termino medio.',
  'arrachera': 'La **Arrachera** es perfecta para tacos y fajitas. Marinala por al menos 2 horas y cocinala a fuego alto por 3-4 minutos por lado. Cortala en contra de la fibra.',
  'new york': 'El **New York** o Strip tiene menos grasa que el ribeye pero es muy tierno. Perfecto para parrilla, sazona con sal gruesa y pimienta antes de cocinar.',
  't-bone': 'El **T-Bone** incluye dos cortes: el filete y el New York, separados por un hueso en forma de T. Ideal para parrilla, cocina primero el lado del filete.',
  'filete': 'El **Filete Mignon** es el corte mas tierno. Tiene poca grasa asi que no lo cocines de mas. Ideal termino medio-rojo.',
  'asado': 'Para **asar** recomiendo: Ribeye (jugoso), Arrachera (para tacos), T-Bone (dos cortes en uno), o New York (balance perfecto).',
  'envio': 'Ofrecemos **envio gratis** en pedidos mayores a $999 MXN. Los pedidos se entregan en 24-48 horas con empaque refrigerado para mantener la cadena de frio.',
  'preparar': 'Tips generales: 1) Saca la carne del refri 30 min antes, 2) Seca bien la superficie, 3) Sazona justo antes de cocinar, 4) Deja reposar 5 min despues de cocinar.',
  'recomendar': '¿Para que ocasion buscas?\n\n- **Parrillada familiar**: Arrachera o Ribeye\n- **Cena romantica**: Filete Mignon\n- **Tacos/Fajitas**: Arrachera marinada\n- **Impresionar invitados**: T-Bone o Tomahawk',
  'precio': 'Los precios varian segun el corte y peso. Visita nuestra seccion de productos para ver precios actualizados. Tenemos ofertas especiales para miembros!',
  'membresia': 'Nuestra **membresia premium** incluye: 10% descuento en todos los productos, envio gratis siempre, acceso a cortes exclusivos y puntos dobles en cada compra.',
};

function getLocalBotResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('hola') || msg.includes('buenos') || msg.includes('hi')) {
    return 'Hola! Soy el asistente de Carnes Premium. ¿En que puedo ayudarte hoy? Puedo recomendarte cortes, explicarte como prepararlos o ayudarte con tu pedido.';
  }
  
  for (const [key, response] of Object.entries(MEAT_KNOWLEDGE)) {
    if (msg.includes(key)) {
      return response;
    }
  }
  
  if (msg.includes('asar') || msg.includes('parrilla') || msg.includes('grill')) {
    return MEAT_KNOWLEDGE['asado'];
  }
  
  if (msg.includes('envio') || msg.includes('entrega') || msg.includes('gratis')) {
    return MEAT_KNOWLEDGE['envio'];
  }
  
  if (msg.includes('preparar') || msg.includes('cocinar') || msg.includes('hacer') || msg.includes('como')) {
    return MEAT_KNOWLEDGE['preparar'];
  }
  
  if (msg.includes('recomienda') || msg.includes('sugieres') || msg.includes('mejor') || msg.includes('cual')) {
    return MEAT_KNOWLEDGE['recomendar'];
  }
  
  if (msg.includes('precio') || msg.includes('cuesta') || msg.includes('cuanto') || msg.includes('valor')) {
    return MEAT_KNOWLEDGE['precio'];
  }
  
  if (msg.includes('membresia') || msg.includes('premium') || msg.includes('beneficio')) {
    return MEAT_KNOWLEDGE['membresia'];
  }
  
  if (msg.includes('gracias') || msg.includes('thanks')) {
    return 'Con gusto! Si tienes mas preguntas sobre nuestros cortes o necesitas ayuda con tu pedido, aqui estoy.';
  }
  
  if (msg.includes('adios') || msg.includes('bye') || msg.includes('chao')) {
    return 'Hasta pronto! Gracias por visitar Carnes Premium. Que disfrutes tu asado!';
  }
  
  return 'Interesante pregunta. Puedo ayudarte con:\n\n- Informacion sobre cortes de carne\n- Recomendaciones segun la ocasion\n- Tips de preparacion\n- Informacion de envios\n- Detalles de membresia\n\n¿Sobre que te gustaria saber mas?';
}

export default function ChatWidget() {
  const { user, isAuthenticated } = useAuth(); 
  const [isOpen, setIsOpen] = useState(false);  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hola! Soy tu asistente de Carnes Premium. ¿En que puedo ayudarte hoy?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatConfig, setChatConfig] = useState<ChatConfig>({ provider: 'none' });
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = isAuthenticated && user?.role === 'ADMIN'; 


  useEffect(() => {
    
    const saved = localStorage.getItem('chatConfig');
    if (saved) {
      setChatConfig(JSON.parse(saved));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const callAIAPI = async (message: string): Promise<string> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: chatHistory,
          provider: chatConfig.provider,
        }),
      });

      const data = await response.json();
      
      if (data.error && !data.message) {
        throw new Error(data.error);
      }
      
      return data.message;
    } catch (error) {
      console.error('AI API Error:', error);
      return getLocalBotResponse(message);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setChatHistory((prev) => [...prev, { role: 'user', content: messageText }]);
    setIsTyping(true);

    let botResponse: string;

    if (chatConfig.provider !== 'none' && (chatConfig.openaiApiKey || chatConfig.minimaxApiKey)) {
      botResponse = await callAIAPI(messageText);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
      botResponse = getLocalBotResponse(messageText);
    }

    setIsTyping(false);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: botResponse,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
    setChatHistory((prev) => [...prev, { role: 'assistant', content: botResponse }]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-gray-600 rotate-90' : 'bg-red-600 hover:bg-red-700 hover:scale-110'
        }`}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Asistente Premium</h3>
                  <p className="text-xs text-red-100">
                    {chatConfig.provider !== 'none' ? `IA: ${chatConfig.provider}` : 'Tu experto en carnes'}
                  </p>
                </div>
              </div>
              <Link href="/admin/settings/chat" className="p-2 hover:bg-white/20 rounded-full transition-colors" title="Configurar chatbot">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user' ? 'bg-red-600' : 'bg-gray-200'}`}>
                    {message.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-gray-600" />}
                  </div>
                  <div className={`p-3 rounded-2xl ${message.sender === 'user' ? 'bg-red-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'}`}>
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && ( 
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-2 border-t border-gray-100 bg-white">
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((reply, index) => (
                <button key={index} onClick={() => handleSend(reply)} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors">
                  {reply}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
              <button onClick={() => handleSend()} disabled={!inputValue.trim()} className="w-10 h-10 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}*/