export interface CourierOrderData {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  alternative_phone?: string;
  recipient_email?: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
  total_lot?: number;
  delivery_type?: number;
}

export interface CourierResponse {
  status: number;
  message: string;
  consignment?: {
    consignment_id: number;
    invoice: string;
    tracking_code: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    status: string;
    note?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface DeliveryStatusResponse {
  status: number;
  delivery_status: string;
}

export interface BalanceResponse {
  status: number;
  current_balance: number;
}

export interface ReturnRequestData {
  consignment_id?: string;
  invoice?: string;
  tracking_code?: string;
  reason?: string;
}

export interface ReturnRequestResponse {
  id: number;
  user_id: number;
  consignment_id: string;
  reason?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export class SteadfastCourierService {
  private apiKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor(apiKey: string, secretKey: string, baseUrl: string = "https://portal.packzy.com/api/v1") {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
  }

  private getHeaders() {
    return {
      'Api-Key': this.apiKey,
      'Secret-Key': this.secretKey,
      'Content-Type': 'application/json'
    };
  }

  async createOrder(orderData: CourierOrderData): Promise<CourierResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/create_order`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating courier order:', error);
      throw error;
    }
  }

  async createBulkOrders(orders: CourierOrderData[]): Promise<any[]> {
    try {
      if (orders.length > 500) {
        throw new Error('Maximum 500 orders allowed per request');
      }

      const response = await fetch(`${this.baseUrl}/create_order/bulk-order`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ data: orders })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating bulk courier orders:', error);
      throw error;
    }
  }

  async getDeliveryStatusByConsignmentId(consignmentId: string): Promise<DeliveryStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/status_by_cid/${consignmentId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting delivery status by consignment ID:', error);
      throw error;
    }
  }

  async getDeliveryStatusByInvoice(invoice: string): Promise<DeliveryStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/status_by_invoice/${invoice}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting delivery status by invoice:', error);
      throw error;
    }
  }

  async getDeliveryStatusByTrackingCode(trackingCode: string): Promise<DeliveryStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/status_by_trackingcode/${trackingCode}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting delivery status by tracking code:', error);
      throw error;
    }
  }

  async getCurrentBalance(): Promise<BalanceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/get_balance`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting current balance:', error);
      throw error;
    }
  }

  async createReturnRequest(returnData: ReturnRequestData): Promise<ReturnRequestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/create_return_request`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(returnData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating return request:', error);
      throw error;
    }
  }

  async getReturnRequest(id: string): Promise<ReturnRequestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/get_return_request/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting return request:', error);
      throw error;
    }
  }

  async getReturnRequests(): Promise<ReturnRequestResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/get_return_requests`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting return requests:', error);
      throw error;
    }
  }
}
