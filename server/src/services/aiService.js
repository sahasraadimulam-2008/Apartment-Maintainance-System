const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiConfig = require('../config/aiConfig');

/**
 * Service handling all AI interactions.
 * Isolates provider details (Gemini) and enforces safety validation and fallback behavior.
 */
class AIService {
  constructor() {
    this.client = null;
    this.model = null;
    this.lastUsedGroqModel = null;
    this.initProvider();
  }

  /**
   * Initialize provider client if credentials are configured
   */
  initProvider() {
    const isGroq = aiConfig.provider === 'groq' || (aiConfig.apiKey && aiConfig.apiKey.startsWith('gsk_'));
    if (aiConfig.isConfigured()) {
      if (isGroq) {
        // Groq uses OpenAI-compatible REST API via global fetch
        this.client = null;
        this.model = null;
      } else {
        try {
          this.client = new GoogleGenerativeAI(aiConfig.apiKey);
          this.model = this.client.getGenerativeModel({
            model: aiConfig.getModel()
          });
        } catch (err) {
          console.warn(`[AIService] Failed to initialize AI client: ${err.message}`);
          this.client = null;
          this.model = null;
        }
      }
    } else {
      this.client = null;
      this.model = null;
    }
  }

  /**
   * Check if AI is ready and configured
   */
  isAvailable() {
    return aiConfig.isConfigured();
  }

  /**
   * Get operational status
   */
  getStatus() {
    const isGroq = aiConfig.provider === 'groq' || (aiConfig.apiKey && aiConfig.apiKey.startsWith('gsk_'));
    return {
      configured: this.isAvailable(),
      provider: isGroq ? 'groq' : aiConfig.provider,
      model: isGroq ? (this.lastUsedGroqModel || aiConfig.getModel()) : aiConfig.getModel(),
      timeoutMs: aiConfig.requestTimeoutMs
    };
  }

  /**
   * Helper method to call Groq OpenAI-compatible chat completions API
   * @param {Array} messages - Array of { role, content } objects
   * @param {Object} [options] - Configuration options
   * @returns {Promise<string>}
   */
  async callGroqApi(messages, options = {}) {
    const { jsonMode = false, maxTokens = 600, temperature = 0.2, modelOverride = null } = options;
    const targetModel = modelOverride || aiConfig.getModel();
    const body = {
      model: targetModel,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), aiConfig.requestTimeoutMs);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errMsg = `Groq API responded with status ${response.status}`;
        let isModelAccessError = false;
        try {
          const errObj = JSON.parse(errorText);
          if (errObj.error?.message) {
            errMsg = `Groq API error: ${errObj.error.message}`;
            if (/model.*does not exist|do not have access/i.test(errObj.error.message)) {
              isModelAccessError = true;
            }
          }
        } catch {
          if (errorText) {
            errMsg += `: ${errorText}`;
            if (/model.*does not exist|do not have access/i.test(errorText)) {
              isModelAccessError = true;
            }
          }
        }

        // Automatic recovery: If target model is unavailable or access-restricted (e.g. 70B tier limitation),
        // attempt seamless fallback to the universally available production model 'llama-3.1-8b-instant'
        if (isModelAccessError && targetModel !== 'llama-3.1-8b-instant') {
          console.warn(`[AIService] Configured Groq model '${targetModel}' is unavailable or access-restricted. Attempting automatic fallback to 'llama-3.1-8b-instant'...`);
          try {
            const fallbackResult = await this.callGroqApi(messages, {
              ...options,
              modelOverride: 'llama-3.1-8b-instant'
            });
            this.lastUsedGroqModel = 'llama-3.1-8b-instant';
            return fallbackResult;
          } catch (fallbackErr) {
            console.error(`[AIService] Fallback to 'llama-3.1-8b-instant' also failed: ${fallbackErr.message}`);
          }
        }

        if (isModelAccessError) {
          errMsg = `Groq API error: The model '${targetModel}' does not exist or your API key lacks access to it. Recommended: Update your server environment with AI_MODEL=llama-3.1-8b-instant.`;
        } else if (response.status === 401) {
          errMsg = 'Groq API authentication failed. Please verify your AI_API_KEY in server environment variables.';
        } else if (response.status === 429) {
          errMsg = 'Groq API rate limit reached. Please wait a moment before sending another request.';
        }

        const err = new Error(errMsg);
        err.statusCode = response.status >= 500 ? 502 : response.status;
        throw err;
      }

      // Record successful model
      this.lastUsedGroqModel = targetModel;

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Groq API returned an empty or invalid response');
      }
      return content;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`AI service request timed out after ${aiConfig.requestTimeoutMs}ms`);
        timeoutErr.statusCode = 502;
        throw timeoutErr;
      }
      throw err;
    }
  }

  /**
   * Validate and sanitize AI classification output
   */
  validateClassificationResult(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('AI output must be a valid JSON object');
    }

    let { category, priority, suggestedAction } = data;

    // Validate category
    if (!category || !aiConfig.validCategories.includes(category)) {
      // Attempt case-insensitive recovery
      const matchedCat = aiConfig.validCategories.find(
        (c) => c.toLowerCase() === String(category || '').toLowerCase()
      );
      category = matchedCat || 'General';
    }

    // Validate priority
    if (!priority || !aiConfig.validPriorities.includes(priority)) {
      const matchedPri = aiConfig.validPriorities.find(
        (p) => p.toLowerCase() === String(priority || '').toLowerCase()
      );
      priority = matchedPri || 'Medium';
    }

    // Validate suggested action
    if (!suggestedAction || typeof suggestedAction !== 'string') {
      suggestedAction = 'Inspect the reported issue and assign to maintenance staff for assessment.';
    }

    // Guardrail against dangerous automated actions
    const dangerousPhrases = [
      'demolish',
      'evacuate building',
      'turn off main city gas',
      'break wall',
      'cut high voltage line'
    ];
    for (const phrase of dangerousPhrases) {
      if (suggestedAction.toLowerCase().includes(phrase)) {
        suggestedAction = 'Schedule licensed technician inspection for safety review.';
        priority = 'Critical';
        break;
      }
    }

    return {
      category,
      priority,
      suggestedAction: suggestedAction.trim()
    };
  }

  /**
   * Heuristic fallback rule-based classifier for offline resilience
   */
  heuristicClassify(text = '') {
    const lower = text.toLowerCase();
    let category = 'General';
    let priority = 'Medium';
    let suggestedAction = 'Inspect the issue on-site and assign relevant personnel.';

    if (/leak|water|pipe|drain|tap|sewage|flush|toilet|faucet|overflow|clog/.test(lower)) {
      category = 'Plumbing';
      if (/flood|burst|continuous|heavy leak|sewage/.test(lower)) {
        priority = 'High';
        suggestedAction = 'Shut off local water isolation valve and inspect pipe joints immediately.';
      } else {
        priority = 'Medium';
        suggestedAction = 'Inspect pipe/fixtures and replace worn washer or seal.';
      }
    } else if (/spark|short circuit|shock|switchboard|power|electric|fuse|wire|tripped|smoke/.test(lower)) {
      category = 'Electrical';
      if (/spark|shock|smoke|burn/.test(lower)) {
        priority = 'Critical';
        suggestedAction = 'Isolate the circuit breaker and dispatch electrician with safety gear.';
      } else {
        priority = 'High';
        suggestedAction = 'Test voltage, check circuit breaker panel, and repair damaged wiring.';
      }
    } else if (/door|window|hinge|lock|handle|cabinet|wood|cupboard|latch/.test(lower)) {
      category = 'Carpentry';
      priority = /lock|unlocked|secure|jammed/.test(lower) ? 'High' : 'Low';
      suggestedAction = 'Examine door/window hardware, tighten hinges, or replace faulty lock.';
    } else if (/ac|air condition|heating|cooler|thermostat|vent|filter/.test(lower)) {
      category = 'HVAC';
      priority = 'Medium';
      suggestedAction = 'Check refrigerant levels, inspect compressor, and clean air filters.';
    } else if (/theft|trespass|cctv|stranger|gate|guard|alarm|camera/.test(lower)) {
      category = 'Security';
      priority = 'High';
      suggestedAction = 'Alert security desk, verify CCTV footage, and inspect perimeter access.';
    } else if (/garbage|pest|insect|rodent|smell|stink|cleaning|dirty|waste/.test(lower)) {
      category = 'Sanitation';
      priority = /infest|rodent|rat|severe/.test(lower) ? 'High' : 'Low';
      suggestedAction = 'Schedule pest control spray or deep sanitation cleaning.';
    } else if (/crack|ceiling|wall|tile|plaster|concrete|balcony/.test(lower)) {
      category = 'Civil/Structural';
      priority = /deep crack|falling|balcony/.test(lower) ? 'High' : 'Medium';
      suggestedAction = 'Civil engineer/mason inspection for structural integrity and plaster repair.';
    }

    return { category, priority, suggestedAction };
  }

  /**
   * Execute a promise with a timeout
   */
  async withTimeout(promise, timeoutMs) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`AI service request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  /**
   * FEATURE A: Classify complaint using AI provider
   * @param {Object} params
   * @param {string} params.description - Problem description
   * @param {string} [params.title] - Optional title
   * @param {Object} [options]
   * @param {boolean} [options.allowFallback=false] - Whether to fallback to heuristic on provider failure
   */
  async classifyComplaint({ title = '', description = '' }, options = { allowFallback: false }) {
    if (!description || description.trim().length === 0) {
      throw new Error('Complaint description is required for AI classification');
    }

    // If no valid AI API key is configured
    if (!this.isAvailable()) {
      if (options.allowFallback) {
        const fallback = this.heuristicClassify(`${title} ${description}`);
        return {
          ...fallback,
          isFallback: true,
          provider: 'heuristic-rules',
          note: 'AI API key not configured; classified using rule-based heuristics.'
        };
      }
      const configError = new Error('AI service is not configured. Please set a valid AI_API_KEY in server environment variables.');
      configError.statusCode = 503;
      configError.isConfigError = true;
      throw configError;
    }

    const prompt = `Analyze this apartment maintenance issue and return a JSON response with exactly these fields:
- "category": Must be strictly one of: [${aiConfig.validCategories.join(', ')}]
- "priority": Must be strictly one of: [${aiConfig.validPriorities.join(', ')}]
- "suggestedAction": A concise, actionable maintenance step for the technician (max 2 sentences).

Rules:
1. Hazardous issues (gas leaks, sparks, structural cracks, active flooding) must be marked High or Critical.
2. Minor cosmetic or comfort issues must be marked Low or Medium.
3. Return ONLY a valid JSON object without markdown code blocks, backticks, or other text.

Complaint Details:
Title: ${title || 'N/A'}
Description: ${description}`;

    const isGroq = aiConfig.provider === 'groq' || (aiConfig.apiKey && aiConfig.apiKey.startsWith('gsk_'));

    try {
      let rawText;
      if (isGroq) {
        const messages = [
          {
            role: 'system',
            content: 'You are an apartment maintenance assistant. Return strictly a valid JSON object with fields: category, priority, suggestedAction.'
          },
          {
            role: 'user',
            content: prompt
          }
        ];
        rawText = await this.callGroqApi(messages, { jsonMode: true, maxTokens: 300, temperature: 0.2 });
      } else {
        const callPromise = this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 300,
            responseMimeType: 'application/json'
          }
        });

        const response = await this.withTimeout(callPromise, aiConfig.requestTimeoutMs);
        rawText = response.response.text();
      }

      // Clean response text if backticks were added
      let jsonString = rawText.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(jsonString);
      const validated = this.validateClassificationResult(parsed);

      return {
        ...validated,
        isFallback: false,
        provider: isGroq ? 'groq' : aiConfig.provider,
        model: isGroq ? (this.lastUsedGroqModel || aiConfig.getModel()) : aiConfig.getModel()
      };
    } catch (error) {
      console.error(`[AIService] Provider error during classification: ${error.message}`);

      if (options.allowFallback) {
        const fallback = this.heuristicClassify(`${title} ${description}`);
        return {
          ...fallback,
          isFallback: true,
          provider: 'heuristic-fallback',
          note: `AI provider encountered an error (${error.message}). Classified using fallback rules.`
        };
      }

      const err = new Error(`AI Classification failed: ${error.message}`);
      err.statusCode = error.statusCode || 502;
      throw err;
    }
  }

  /**
   * FEATURE B: Apartment FAQ Chatbot
   * @param {Object} params
   * @param {string} params.message - Resident or visitor query
   * @param {Array} [params.conversationHistory] - Previous chat messages
   */
  async chatWithAssistant({ message, conversationHistory = [] }) {
    if (!message || message.trim().length === 0) {
      throw new Error('Message is required for chat');
    }

    if (!this.isAvailable()) {
      const configError = new Error('AI service is not configured. Please set a valid AI_API_KEY in server environment variables.');
      configError.statusCode = 503;
      configError.isConfigError = true;
      throw configError;
    }

    const isGroq = aiConfig.provider === 'groq' || (aiConfig.apiKey && aiConfig.apiKey.startsWith('gsk_'));

    try {
      let reply;
      if (isGroq) {
        const messages = [
          {
            role: 'system',
            content: aiConfig.faqSystemInstruction
          }
        ];

        if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
          for (const msg of conversationHistory.slice(-6)) {
            if (msg.role && msg.content) {
              messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: String(msg.content)
              });
            }
          }
        }

        messages.push({
          role: 'user',
          content: message
        });

        reply = await this.callGroqApi(messages, { maxTokens: 600, temperature: 0.3 });
      } else {
        // Build conversation turns
        const contents = [];

        // Append verified guidelines into system context
        const fullSystemPrompt = `${aiConfig.faqSystemInstruction}\n\nUser Question: ${message}`;

        // If conversation history provided, sanitize and format
        if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
          for (const msg of conversationHistory.slice(-6)) {
            if (msg.role && msg.content) {
              messages.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: String(msg.content) }]
              });
            }
          }
        }

        // Add current user prompt
        contents.push({
          role: 'user',
          parts: [{ text: fullSystemPrompt }]
        });

        const callPromise = this.model.generateContent({
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600
          }
        });

        const response = await this.withTimeout(callPromise, aiConfig.requestTimeoutMs);
        reply = response.response.text();
      }

      return {
        reply: reply.trim(),
        provider: isGroq ? 'groq' : aiConfig.provider,
        model: isGroq ? (this.lastUsedGroqModel || aiConfig.getModel()) : aiConfig.getModel(),
        disclaimer: 'Automated response based on standard apartment guidelines. For private account or payment details, please contact the Management Office.'
      };
    } catch (error) {
      console.error(`[AIService] Chat error: ${error.message}`);
      const err = new Error(`AI Chat Assistant error: ${error.message}`);
      err.statusCode = error.statusCode || 502;
      throw err;
    }
  }
}

// Export a singleton instance
module.exports = new AIService();
