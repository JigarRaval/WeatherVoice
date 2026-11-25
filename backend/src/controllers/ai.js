import { getOllamaService } from '../services/ollama.js';
import { asyncHandler, AppError } from '../middleware/error.js';

export const explainForecast = asyncHandler(async (req, res) => {
  const { weatherData } = req.body;

  if (!weatherData) {
    throw new AppError(400, 'Weather data is required');
  }

  const ollamaService = getOllamaService();
  
  // Check if Ollama is available
  const isAvailable = await ollamaService.isAvailable();
  if (!isAvailable) {
    return res.json({
      success: false,
      error: 'AI service is not available. Weather features continue to work normally.',
      available: false
    });
  }

  try {
    const explanation = await ollamaService.explainForecast(weatherData);
    
    res.json({
      success: true,
      data: {
        explanation,
        model: ollamaService.getModel()
      }
    });
  } catch (error) {
    console.error('AI explanation error:', error.message);
    res.json({
      success: false,
      error: 'Failed to generate explanation. Please try again later.',
      available: true
    });
  }
});

export const answerQuestion = asyncHandler(async (req, res) => {
  const { question, weatherData } = req.body;

  if (!question) {
    throw new AppError(400, 'Question is required');
  }

  if (!weatherData) {
    throw new AppError(400, 'Weather data is required');
  }

  // Validate question length to prevent abuse
  if (question.length > 500) {
    throw new AppError(400, 'Question is too long (max 500 characters)');
  }

  const ollamaService = getOllamaService();
  
  // Check if Ollama is available
  const isAvailable = await ollamaService.isAvailable();
  if (!isAvailable) {
    return res.json({
      success: false,
      error: 'AI service is not available. Weather features continue to work normally.',
      available: false
    });
  }

  try {
    const answer = await ollamaService.answerQuestion(question, weatherData);
    
    res.json({
      success: true,
      data: {
        answer,
        model: ollamaService.getModel()
      }
    });
  } catch (error) {
    console.error('AI answer error:', error.message);
    res.json({
      success: false,
      error: 'Failed to generate answer. Please try again later.',
      available: true
    });
  }
});

export const checkAvailability = asyncHandler(async (req, res) => {
  const ollamaService = getOllamaService();
  const isAvailable = await ollamaService.isAvailable();
  
  res.json({
    success: true,
    data: {
      available: isAvailable,
      model: ollamaService.getModel(),
      url: ollamaService.getBaseUrl()
    }
  });
});
