import { registerAs } from '@nestjs/config';

export default registerAs('apiAuth', () => ({
  enabled: process.env.API_AUTH_ENABLED === 'true',
  legacyKey: process.env.API_AUTH_KEY || '',
  legacyToken: process.env.API_AUTH_TOKEN || '',
  legacyUser: process.env.API_AUTH_USER || '',
}));