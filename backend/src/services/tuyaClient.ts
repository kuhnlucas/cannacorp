/**
 * Tuya IoT Cloud Client
 * Implementa autenticación, firma HMAC y comunicación con Tuya OpenAPI
 * Docs: https://developer.tuya.com/en/docs/iot/api-reference
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';

interface TuyaConfig {
  clientId: string;
  clientSecret: string;
  region: string; // 'us', 'eu', 'cn', 'in'
  baseUrl?: string;
}

interface TuyaTokenResponse {
  success: boolean;
  result: {
    access_token: string;
    expire_time: number; // seconds
    refresh_token: string;
    uid: string;
  };
  t: number;
  tid: string;
}

interface TuyaDevice {
  id: string;
  name: string;
  category: string;
  product_id: string;
  product_name: string;
  online: boolean;
  status: Array<{
    code: string;
    value: any;
  }>;
  create_time: number;
  update_time: number;
  icon: string;
  ip: string;
  time_zone: string;
  active_time: number;
  local_key: string;
  uuid: string;
  node_id?: string;
  sub?: boolean;
}

export class TuyaClient {
  private config: TuyaConfig;
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpireTime: number = 0;
  private baseUrl: string;

  // Regional endpoints
  private static REGION_URLS: { [key: string]: string } = {
    us: 'https://openapi.tuyaus.com',           // Western America (USA, Canada)
    ueaz: 'https://openapi-ueaz.tuyaus.com',    // Eastern America (Chile, Argentina, Brasil, México, etc.)
    weaz: 'https://openapi-weaz.tuyaeu.com',    // Western Europe (España, Francia, UK, etc.)
    eu: 'https://openapi.tuyaeu.com',           // Central Europe (Polonia, Rusia, África)
    cn: 'https://openapi.tuyacn.com',           // China
    in: 'https://openapi.tuyain.com',           // India
    ase1: 'https://openapi-ase1.tuyacn.com',    // Asia-Pacific (Singapore)
  };

  constructor(config: TuyaConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || TuyaClient.REGION_URLS[config.region] || TuyaClient.REGION_URLS.us;
    
    console.log('🔧 Tuya Client initialized:', {
      region: config.region,
      baseUrl: this.baseUrl,
      configuredUrl: config.baseUrl,
    });

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth headers
    this.client.interceptors.request.use(
      async (config) => {
        await this.ensureValidToken();
        return this.signRequest(config) as any;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (!response.data.success) {
          const error = new Error(response.data.msg || 'Tuya API error');
          (error as any).code = response.data.code;
          (error as any).response = response.data;
          throw error;
        }
        return response;
      },
      (error) => {
        console.error('Tuya API Error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Genera la firma HMAC-SHA256 requerida por Tuya
   */
  private generateSign(
    clientId: string,
    timestamp: string,
    accessToken: string,
    method: string,
    path: string,
    body: string = ''
  ): string {
    const contentHash = crypto.createHash('sha256').update(body).digest('hex').toLowerCase();
    const stringToSign = [method, contentHash, '', path].join('\n');
    const signStr = clientId + accessToken + timestamp + stringToSign;

    return crypto
      .createHmac('sha256', this.config.clientSecret)
      .update(signStr, 'utf8')
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Firma una request con los headers requeridos por Tuya
   */
  private signRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    const timestamp = Date.now().toString();
    const method = (config.method || 'GET').toUpperCase();
    const path = config.url || '';
    const body = config.data ? JSON.stringify(config.data) : '';
    const token = this.accessToken || '';

    const sign = this.generateSign(
      this.config.clientId,
      timestamp,
      token,
      method,
      path,
      body
    );

    config.headers = config.headers || {};
    config.headers['client_id'] = this.config.clientId;
    config.headers['sign'] = sign;
    config.headers['t'] = timestamp;
    config.headers['sign_method'] = 'HMAC-SHA256';

    if (this.accessToken) {
      config.headers['access_token'] = this.accessToken;
    }

    return config;
  }

  /**
   * Obtiene un nuevo access token
   */
  async getAccessToken(): Promise<string> {
    try {
      const timestamp = Date.now().toString();
      const sign = this.generateSign(
        this.config.clientId,
        timestamp,
        '',
        'GET',
        '/v1.0/token?grant_type=1'
      );

      const response = await axios.get<TuyaTokenResponse>(
        `${this.baseUrl}/v1.0/token?grant_type=1`,
        {
          headers: {
            'client_id': this.config.clientId,
            'sign': sign,
            't': timestamp,
            'sign_method': 'HMAC-SHA256',
          },
        }
      );

      if (response.data.success) {
        this.accessToken = response.data.result.access_token;
        this.refreshToken = response.data.result.refresh_token;
        this.tokenExpireTime = Date.now() + response.data.result.expire_time * 1000;

        console.log('✅ Tuya access token obtained successfully');
        return this.accessToken;
      } else {
        throw new Error(`Failed to get access token: ${response.data}`);
      }
    } catch (error: any) {
      console.error('❌ Error getting Tuya access token:', error.message);
      throw error;
    }
  }

  /**
   * Refresca el access token usando el refresh token
   */
  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      return this.getAccessToken();
    }

    try {
      const timestamp = Date.now().toString();
      const sign = this.generateSign(
        this.config.clientId,
        timestamp,
        this.refreshToken,
        'GET',
        `/v1.0/token/${this.refreshToken}`
      );

      const response = await axios.get<TuyaTokenResponse>(
        `${this.baseUrl}/v1.0/token/${this.refreshToken}`,
        {
          headers: {
            'client_id': this.config.clientId,
            'sign': sign,
            't': timestamp,
            'sign_method': 'HMAC-SHA256',
          },
        }
      );

      if (response.data.success) {
        this.accessToken = response.data.result.access_token;
        this.refreshToken = response.data.result.refresh_token;
        this.tokenExpireTime = Date.now() + response.data.result.expire_time * 1000;

        console.log('✅ Tuya access token refreshed successfully');
        return this.accessToken;
      } else {
        return this.getAccessToken();
      }
    } catch (error) {
      console.error('Error refreshing token, getting new one:', error);
      return this.getAccessToken();
    }
  }

  /**
   * Asegura que el token sea válido antes de hacer una request
   */
  private async ensureValidToken(): Promise<void> {
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

    if (!this.accessToken || now >= this.tokenExpireTime - bufferTime) {
      if (this.refreshToken && now < this.tokenExpireTime) {
        await this.refreshAccessToken();
      } else {
        await this.getAccessToken();
      }
    }
  }

  /**
   * Lista todos los dispositivos de un usuario específico por UID
   * Este es el método principal para vincular cuentas Smart Life
   */
  async listDevicesByUid(uid: string): Promise<TuyaDevice[]> {
    try {
      console.log(`🔍 Fetching devices for UID: ${uid} from ${this.baseUrl}`);
      const response = await this.client.get(`/v1.0/users/${uid}/devices`);
      
      if (response.data.success && response.data.result) {
        const devices = response.data.result;
        console.log(`✅ Found ${devices.length} devices`);
        if (devices.length > 0) {
          console.log(`📊 First device sample:`, JSON.stringify({
            id: devices[0].id,
            name: devices[0].name,
            online: devices[0].online,
            status: devices[0].status,
            hasStatus: !!devices[0].status,
            statusLength: devices[0].status?.length || 0
          }, null, 2));
        }
        return devices;
      }
      
      return [];
    } catch (error: any) {
      // Si el error es 1004 significa que el UID no existe o no tiene permisos
      if (error.response?.data?.code === 1004) {
        throw new Error('UID not found or no permission. Verify the UID is correct and the Smart Life account is properly linked.');
      }
      console.error('Error listing devices by UID:', error.message);
      throw error;
    }
  }

  /**
   * Lista todos los dispositivos del usuario/asset vinculado
   * Para Cloud Projects tipo Smart Home, necesitas vincular tu cuenta Smart Life primero
   */
  async listDevices(userId?: string): Promise<TuyaDevice[]> {
    if (userId) {
      return this.listDevicesByUid(userId);
    }

    try {
      // Estrategia: Obtener por assets (funciona para Cloud Projects)
      try {
        const assetsResponse = await this.client.get('/v1.0/iot-02/assets');
        if (assetsResponse.data.success) {
          const assets = assetsResponse.data.result || [];
          
          // Si no hay assets, retornar array vacío
          if (!assets || assets.length === 0) {
            console.log('ℹ️  No hay assets/dispositivos vinculados al Cloud Project');
            console.log('   Vincula tu cuenta Smart Life en: Cloud → Link Tuya App Account');
            return [];
          }

          // Si hay assets, obtener devices de cada asset
          const allDevices: TuyaDevice[] = [];
          for (const asset of assets) {
            try {
              const devicesResponse = await this.client.get(`/v1.0/iot-02/assets/${asset.asset_id}/devices`);
              if (devicesResponse.data.success && devicesResponse.data.result) {
                allDevices.push(...devicesResponse.data.result);
              }
            } catch (error) {
              // Continuar con el siguiente asset
              continue;
            }
          }
          return allDevices;
        }
      } catch (error: any) {
        console.log('Error obteniendo por assets:', error.message);
      }

      // Si llegamos aquí, no hay dispositivos
      console.log('ℹ️  No se encontraron dispositivos');
      console.log('   Asegúrate de:');
      console.log('   1. Habilitar APIs en: Cloud → API Group');
      console.log('   2. Vincular cuenta: Cloud → Link Tuya App Account');
      return [];
    } catch (error: any) {
      console.error('Error listing Tuya devices:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el estado actual de un dispositivo
   */
  async getDeviceStatus(deviceId: string): Promise<TuyaDevice> {
    try {
      const response = await this.client.get(`/v1.0/devices/${deviceId}`);
      return response.data.result;
    } catch (error: any) {
      console.error(`Error getting device ${deviceId} status:`, error.message);
      throw error;
    }
  }

  /**
   * Envía comandos a un dispositivo
   * @param deviceId ID del dispositivo
   * @param commands Array de comandos [{code: 'switch', value: true}, ...]
   */
  async sendCommands(deviceId: string, commands: Array<{ code: string; value: any }>): Promise<boolean> {
    try {
      const response = await this.client.post(`/v1.0/devices/${deviceId}/commands`, {
        commands,
      });
      return response.data.success;
    } catch (error: any) {
      console.error(`Error sending commands to device ${deviceId}:`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene las especificaciones/funciones de un dispositivo
   */
  async getDeviceSpecifications(deviceId: string): Promise<any> {
    try {
      const response = await this.client.get(`/v1.0/devices/${deviceId}/specifications`);
      return response.data.result;
    } catch (error: any) {
      console.error(`Error getting device ${deviceId} specifications:`, error.message);
      throw error;
    }
  }

  /**
   * Obtiene información del usuario desde el token
   */
  async getUserInfo(userId?: string): Promise<any> {
    try {
      if (userId) {
        const response = await this.client.get(`/v1.0/users/${userId}`);
        return response.data.result;
      }
      
      // Si no hay userId, intentar obtener info del token actual
      // Esto funciona si el Cloud Project tiene usuario vinculado
      const response = await this.client.get('/v1.0/token/user');
      return response.data.result;
    } catch (error: any) {
      console.error('Error getting user info:', error.message);
      return null;
    }
  }

  /**
   * Obtiene logs de un dispositivo
   */
  async getDeviceLogs(deviceId: string, startTime?: number, endTime?: number): Promise<any[]> {
    try {
      const params: any = {};
      if (startTime) params.start_time = startTime;
      if (endTime) params.end_time = endTime;

      const response = await this.client.get(`/v1.0/devices/${deviceId}/logs`, { params });
      return response.data.result || [];
    } catch (error: any) {
      console.error(`Error getting device ${deviceId} logs:`, error.message);
      throw error;
    }
  }
}

/**
 * Factory para crear instancias del cliente Tuya
 */
export function createTuyaClient(config?: Partial<TuyaConfig>): TuyaClient {
  const clientId = config?.clientId || process.env.TUYA_CLIENT_ID;
  const clientSecret = config?.clientSecret || process.env.TUYA_CLIENT_SECRET;
  const region = config?.region || process.env.TUYA_REGION || 'us';
  const baseUrl = config?.baseUrl || process.env.TUYA_BASE_URL;

  if (!clientId || !clientSecret) {
    throw new Error('Tuya credentials not configured. Set TUYA_CLIENT_ID and TUYA_CLIENT_SECRET in .env');
  }

  return new TuyaClient({
    clientId,
    clientSecret,
    region,
    baseUrl,
  });
}

export default TuyaClient;
