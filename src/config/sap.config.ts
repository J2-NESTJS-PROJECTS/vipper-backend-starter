import { registerAs } from '@nestjs/config';

export default registerAs('sap', () => ({
  host: process.env.SAP_HOST || 'localhost',
  sysnr: process.env.SAP_SYSNR || '00',
  client: process.env.SAP_CLIENT || '100',
  user: process.env.SAP_USER || '',
  passwd: process.env.SAP_PASSWD || '',
  lang: process.env.SAP_LANG || 'EN',
  poolSize: parseInt(process.env.SAP_POOL_SIZE, 10) || 5,
}));
