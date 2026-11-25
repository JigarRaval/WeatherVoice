import { useState, useEffect } from 'react';

function AIInsights({ weatherData, forecastData, speechEnabled }) {
  const [explanation, setExplanation] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        setIsListening(false);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const handleExplain = async () => {
    setLoading(true);
    setExplanation('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weatherData, forecastData })
      });
      const data = await response.json();
      
      if (data.success) {
        setExplanation(data.data.explanation);
        if (speechEnabled && 'speechSynthesis' in window) {
          speak(data.data.explanation);
        }
      } else {
        setAiAvailable(data.available !== false);
        setExplanation(data.error || 'Failed to get explanation');
      }
    } catch (err) {
      console.error('AI explanation error:', err);
      setExplanation('Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setAnswer('');
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/ai/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, weatherData, forecastData })
      });
      const data = await response.json();
      
      if (data.success) {
        setAnswer(data.data.answer);
        if (speechEnabled && 'speechSynthesis' in window) {
          speak(data.data.answer);
        }
      } else {
        setAiAvailable(data.available !== false);
        setAnswer(data.error || 'Failed to get answer');
      }
    } catch (err) {
      console.error('AI question error:', err);
      setAnswer('Failed to connect to AI service');
    } finally {
      setLoading(false);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser');
    }
  };

  const canUseVoice = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  const canUseSpeech = 'speechSynthesis' in window;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">AI Weather Insights</h3>

      {!aiAvailable && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          AI service is currently unavailable. Weather features continue to work normally.
        </div>
      )}

      {/* Explain Forecast */}
      <div className="mb-6">
        <button
          onClick={handleExplain}
          disabled={loading || !aiAvailable}
          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Generating...' : 'Explain This Forecast'}
        </button>
        
        {explanation && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <p className="text-gray-700">{explanation}</p>
          </div>
        )}
      </div>

      {/* Ask Question */}
      <div>
        <h4 className="font-semibold text-gray-700 mb-2">Ask a Question</h4>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about the weather..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading || !aiAvailable}
            onKeyPress={(e) => e.key === 'Enter' && handleQuestion()}
            aria-label="Ask weather question"
          />
          {canUseVoice && (
            <button
              onClick={startListening}
              disabled={loading || !aiAvailable || isListening}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              aria-label="Voice input"
            >
              {isListening ? '🎤 Listening...' : '🎤'}
            </button>
          )}
          <button
            onClick={handleQuestion}
            disabled={loading || !aiAvailable || !question.trim()}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Ask
          </button>
        </div>

        {answer && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <p className="text-gray-700">{answer}</p>
          </div>
        )}

        {!canUseVoice && (
          <p className="text-sm text-gray-500 mt-2">
            Voice input is not supported in your browser. Use text input instead.
          </p>
        )}
      </div>
    </div>
  );
}

export default AIInsights;
