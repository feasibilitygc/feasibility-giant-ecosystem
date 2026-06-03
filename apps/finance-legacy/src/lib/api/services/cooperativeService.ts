import { apiService } from '@/lib/api/apiService';

export interface RegisterCooperativeInput {
  name: string;
  registration_number: string;
  country: string;
  currency: string;
  subdomain: string;
  admin_user: {
    name: string;
    email: string;
    password: string;
  };
}

export interface RegisterCooperativeResponse {
  status: 'success';
  message: string;
  data: {
    cooperative_id: string;
    subdomain: string;
    portal_url: string;
  };
}

export interface CooperativeListItem {
  id: string;
  name: string;
  subdomain: string;
}

export interface CooperativeListResponse {
  status: 'success';
  data: CooperativeListItem[];
}

class CooperativeService {
  /**
   * Register a new cooperative (tenant)
   * POST /cooperatives/register
   */
  async registerCooperative(data: RegisterCooperativeInput): Promise<RegisterCooperativeResponse> {
    return apiService.post('/cooperatives/register', data);
  }

  /**
   * Fetch a list of all registered cooperatives (for dropdown selection)
   * GET /cooperatives/list
   */
  async listCooperatives(): Promise<CooperativeListResponse> {
    return apiService.get('/cooperatives/list');
  }
}

export const cooperativeService = new CooperativeService();
export default cooperativeService;
