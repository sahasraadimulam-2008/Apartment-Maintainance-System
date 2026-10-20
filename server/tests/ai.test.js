const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const aiService = require('../src/services/aiService');
const generateToken = require('../src/utils/generateToken');
const { connectTestDB, clearTestDB, closeTestDB } = require('./setup');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await closeTestDB();
});

describe('AI Features & Safety Suite', () => {
  let userToken;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Test Resident',
      email: 'ai_resident@example.com',
      password: 'password123',
      role: 'resident'
    });
    userToken = generateToken(user);
  });

  describe('POST /api/ai/classify-complaint', () => {
    it('should reject requests with missing description (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/ai/classify-complaint')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/description is required/i);
    });

    it('should return 503 clear configuration error when AI API key is unconfigured', async () => {
      // Ensure AI service is marked not configured
      jest.spyOn(aiService, 'isAvailable').mockReturnValue(false);

      const res = await request(app)
        .post('/api/ai/classify-complaint')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Water leaking vigorously from the bathroom ceiling.'
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/AI service is not configured/i);
    });

    it('should successfully return validated structured result when AI provider returns classification', async () => {
      // Mock AI provider execution
      jest.spyOn(aiService, 'isAvailable').mockReturnValue(true);
      jest.spyOn(aiService, 'classifyComplaint').mockResolvedValue({
        category: 'Plumbing',
        priority: 'High',
        suggestedAction: 'Inspect water supply line and shut off valve.',
        isFallback: false,
        provider: 'gemini',
        model: 'gemini-2.5-flash'
      });

      const res = await request(app)
        .post('/api/ai/classify-complaint')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Ceiling drip',
          description: 'Water leaking steadily from upstairs pipe joint'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Plumbing');
      expect(res.body.data.priority).toBe('High');
      expect(res.body.data.suggestedAction).toBe('Inspect water supply line and shut off valve.');
      expect(res.body.data.isFallback).toBe(false);
    });

    it('should enforce safety guardrail against dangerous automated actions', () => {
      // Unit test the validation guardrail
      const unsafeOutput = {
        category: 'Structural',
        priority: 'Medium',
        suggestedAction: 'Demolish the cracked retaining wall immediately'
      };

      const sanitized = aiService.validateClassificationResult(unsafeOutput);
      expect(sanitized.suggestedAction).not.toMatch(/demolish/i);
      expect(sanitized.suggestedAction).toMatch(/licensed technician inspection/i);
      expect(sanitized.priority).toBe('Critical');
    });

    it('should handle AI provider timeouts / failure gracefully (502 Bad Gateway)', async () => {
      jest.spyOn(aiService, 'isAvailable').mockReturnValue(true);
      const providerError = new Error('AI service request timed out after 10000ms');
      providerError.statusCode = 502;
      jest.spyOn(aiService, 'classifyComplaint').mockRejectedValue(providerError);

      const res = await request(app)
        .post('/api/ai/classify-complaint')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Elevator making strange loud screeching noises'
        });

      expect(res.status).toBe(502);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/timed out/i);
    });

    it('should utilize safe heuristic fallback when allowFallback flag is enabled', async () => {
      // Unconfigured AI key, but fallback allowed
      jest.spyOn(aiService, 'isAvailable').mockReturnValue(false);

      const res = await request(app)
        .post('/api/ai/classify-complaint')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Main breaker sparking',
          description: 'Sparking circuit breaker fuse inside meter box',
          allowFallback: true
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Electrical');
      expect(res.body.data.priority).toBe('Critical');
      expect(res.body.data.isFallback).toBe(true);
      expect(res.body.data.provider).toBe('heuristic-rules');
    });
  });

  describe('POST /api/ai/chat (Apartment FAQ Chatbot)', () => {
    it('should reject requests with missing message string (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return clear configuration error when AI is unconfigured', async () => {
      jest.spyOn(aiService, 'isAvailable').mockReturnValue(false);

      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'What time does the clubhouse gym open?'
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/AI service is not configured/i);
    });

    it('should return AI assistant reply when provider is configured and available', async () => {
      jest.spyOn(aiService, 'isAvailable').mockReturnValue(true);
      jest.spyOn(aiService, 'chatWithAssistant').mockResolvedValue({
        reply: 'The clubhouse gym is open daily from 6:00 AM to 10:00 PM.',
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        disclaimer: 'Automated response based on standard apartment guidelines.'
      });

      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'What time does the gym open?'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toMatch(/6:00 AM to 10:00 PM/i);
      expect(res.body.data.disclaimer).toBeDefined();
    });
  });

  describe('GET /api/ai/status', () => {
    it('should return operational status of AI service without exposing API key', async () => {
      const res = await request(app)
        .get('/api/ai/status')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBeDefined();
      expect(res.body.data.model).toBeDefined();
      expect(typeof res.body.data.configured).toBe('boolean');
      // Crucial: API key must NEVER be leaked to client
      expect(res.body.data.apiKey).toBeUndefined();
      expect(res.body.data.key).toBeUndefined();
    });

    it('should support Groq provider when configured via AI_PROVIDER or Groq API key', async () => {
      jest.spyOn(aiService, 'isAvailable').mockReturnValue(true);
      jest.spyOn(aiService, 'callGroqApi').mockResolvedValue(
        JSON.stringify({
          category: 'Plumbing',
          priority: 'High',
          suggestedAction: 'Shut off main valve and inspect the pipe joint.'
        })
      );

      // Force Groq provider
      const originalProvider = require('../src/config/aiConfig').provider;
      require('../src/config/aiConfig').provider = 'groq';

      const res = await request(app)
        .post('/api/ai/classify-complaint')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Pipe leak',
          description: 'Burst water pipe under sink in kitchen'
        });

      require('../src/config/aiConfig').provider = originalProvider;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('Plumbing');
      expect(res.body.data.provider).toBe('groq');
      expect(res.body.data.suggestedAction).toBe('Shut off main valve and inspect the pipe joint.');
    });

    it('should automatically fallback to llama-3.1-8b-instant if configured Groq model is unavailable', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;
      global.fetch = jest.fn(async (url, options) => {
        callCount++;
        const body = JSON.parse(options.body);
        if (body.model === 'llama-3.3-70b-versatile') {
          return {
            ok: false,
            status: 404,
            text: async () => JSON.stringify({
              error: {
                message: "The model `llama-3.3-70b-versatile` does not exist or you do not have access to it."
              }
            })
          };
        }
        if (body.model === 'llama-3.1-8b-instant') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              choices: [{
                message: {
                  content: JSON.stringify({
                    category: 'Plumbing',
                    priority: 'High',
                    suggestedAction: 'Repair sink pipe.'
                  })
                }
              }]
            })
          };
        }
        return { ok: false, status: 500, text: async () => 'Internal error' };
      });

      const aiCfg = require('../src/config/aiConfig');
      const originalApiKey = aiCfg.apiKey;
      aiCfg.apiKey = 'gsk_mock_test_key_12345';
      jest.spyOn(aiService, 'isAvailable').mockReturnValue(true);

      const originalModel = aiCfg.modelName;
      aiCfg.modelName = 'llama-3.3-70b-versatile';
      const originalProvider = aiCfg.provider;
      aiCfg.provider = 'groq';

      const result = await aiService.classifyComplaint({
        title: 'Pipe Leak',
        description: 'Water pipe leaking under kitchen counter'
      });

      expect(callCount).toBe(2);
      expect(result.category).toBe('Plumbing');
      expect(result.model).toBe('llama-3.1-8b-instant');

      aiCfg.modelName = originalModel;
      aiCfg.provider = originalProvider;
      aiCfg.apiKey = originalApiKey;
      global.fetch = originalFetch;
    });

    it('should provide clear error hint if Groq model fails without fallback', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn(async () => {
        return {
          ok: false,
          status: 404,
          text: async () => JSON.stringify({
            error: {
              message: "The model `llama-3.1-8b-instant` does not exist or you do not have access to it."
            }
          })
        };
      });

      const aiCfg = require('../src/config/aiConfig');
      const originalApiKey = aiCfg.apiKey;
      aiCfg.apiKey = 'gsk_mock_test_key_12345';
      jest.spyOn(aiService, 'isAvailable').mockReturnValue(true);

      const originalModel = aiCfg.modelName;
      aiCfg.modelName = 'llama-3.1-8b-instant';
      const originalProvider = aiCfg.provider;
      aiCfg.provider = 'groq';

      await expect(
        aiService.classifyComplaint({
          title: 'Pipe Leak',
          description: 'Water pipe leaking under kitchen counter'
        })
      ).rejects.toThrow(/Recommended: Update your server environment with AI_MODEL=llama-3.1-8b-instant/i);

      aiCfg.modelName = originalModel;
      aiCfg.provider = originalProvider;
      aiCfg.apiKey = originalApiKey;
      global.fetch = originalFetch;
    });
  });
});
