const aiService = require('../services/aiService');

/**
 * @desc    Classify complaint issue using AI provider
 * @route   POST /api/ai/classify-complaint
 * @access  Private (Authenticated users: resident, staff, admin)
 */
const classifyComplaint = async (req, res, next) => {
  try {
    const { title, description, allowFallback } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Complaint description is required for AI categorization'
      });
    }

    const result = await aiService.classifyComplaint(
      { title, description },
      { allowFallback: Boolean(allowFallback) }
    );

    return res.status(200).json({
      success: true,
      message: 'Complaint categorized successfully',
      data: result
    });
  } catch (error) {
    if (error.isConfigError) {
      return res.status(error.statusCode || 503).json({
        success: false,
        error: error.message,
        hint: 'Please set the AI_API_KEY environment variable in your server configuration.'
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    next(error);
  }
};

/**
 * @desc    Apartment FAQ chatbot assistance
 * @route   POST /api/ai/chat
 * @access  Private (Authenticated users)
 */
const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message string is required'
      });
    }

    const result = await aiService.chatWithAssistant({
      message,
      conversationHistory: conversationHistory || []
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.isConfigError) {
      return res.status(error.statusCode || 503).json({
        success: false,
        error: error.message,
        hint: 'Please set the AI_API_KEY environment variable in your server configuration.'
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message
      });
    }

    next(error);
  }
};

/**
 * @desc    Get AI service health and readiness status
 * @route   GET /api/ai/status
 * @access  Private
 */
const getAiStatus = async (req, res) => {
  const status = aiService.getStatus();
  return res.status(200).json({
    success: true,
    data: status
  });
};

module.exports = {
  classifyComplaint,
  chatWithAssistant,
  getAiStatus
};
