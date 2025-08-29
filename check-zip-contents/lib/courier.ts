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

export interface PaymentHistoryItem {
  id?: string;
  statement_no?: string;
  invoice_no?: string;
  date: string;
  amount: number;
  delivered_count?: number;
  returned_count?: number;
  cod_charge?: number;
  delivery_charge?: number;
  adjustment?: number;
  note?: string;
}

export interface PaymentHistoryResponse {
  status: number;
  data: PaymentHistoryItem[];
  pagination?: {
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  }
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

  async getPaymentHistory(params: { from?: string; to?: string; page?: number; pageSize?: number } = {}): Promise<PaymentHistoryResponse> {
    const { from, to, page, pageSize } = params;

    // Possible endpoints used by Packzy/Steadfast
    const paths = [
      '/merchant/payment-history',
      '/merchant/payments',
      '/payments/history',
      '/merchant/ledger',
      '/merchant/statement',
      '/statement',
      '/merchant/paid-statement',
      '/paid-statement',
      '/get_paid_statement',
      '/merchant/cod-statement',
      '/merchant/cod-history',
      '/cod-statement'
    ];

    // Possible date parameter key pairs used by courier APIs
    const dateParamVariants: Array<[string, string]> = [
      ['from', 'to'],
      ['start_date', 'end_date'],
      ['date_from', 'date_to'],
      ['startDate', 'endDate']
    ];

    const methods: Array<'GET' | 'POST'> = ['GET', 'POST'];

    let lastError: any = null;

    for (const relPath of paths) {
      for (const [fromKey, toKey] of dateParamVariants) {
        for (const method of methods) {
          try {
            const url = `${this.baseUrl}${relPath}`;
            const headers = this.getHeaders();

            let response: Response;
            if (method === 'GET') {
              const qs = new URLSearchParams();
              if (from) qs.set(fromKey, from);
              if (to) qs.set(toKey, to);
              if (page) qs.set('page', String(page));
              if (pageSize) qs.set('pageSize', String(pageSize));
              const fullUrl = qs.toString() ? `${url}?${qs.toString()}` : url;
              response = await fetch(fullUrl, { method: 'GET', headers });
            } else {
              const body: any = {};
              if (from) body[fromKey] = from;
              if (to) body[toKey] = to;
              if (page) body.page = page;
              if (pageSize) body.pageSize = pageSize;
              response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            }

            if (!response.ok) {
              lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
              continue;
            }

            const raw = await response.json();

            // Normalize shapes: data, payments, statements, history, items
            let rows: any[] | undefined = undefined;
            if (Array.isArray(raw?.data)) rows = raw.data;
            else if (Array.isArray(raw?.payments)) rows = raw.payments;
            else if (Array.isArray(raw?.statements)) rows = raw.statements;
            else if (Array.isArray(raw?.history)) rows = raw.history;
            else if (Array.isArray(raw)) rows = raw;

            if (!rows) {
              lastError = new Error('Unsupported payment history response shape');
              continue;
            }

            const items: PaymentHistoryItem[] = rows.map((r: any) => ({
              id: r.id || r.statement_no || r.invoice_no || r.reference || r.ref,
              statement_no: r.statement_no || r.statementNo || r.statement || r.reference,
              invoice_no: r.invoice_no || r.invoiceNo,
              date: r.date || r.created_at || r.createdAt || r.paid_at || r.statement_date || r.statementDate,
              amount: Number(r.amount ?? r.paid_amount ?? r.total_amount ?? r.total ?? 0),
              delivered_count: r.delivered_count ?? r.delivered ?? r.delivered_parcels,
              returned_count: r.returned_count ?? r.returned ?? r.return_parcels,
              cod_charge: r.cod_charge ?? r.codCharge ?? r.cod_fee,
              delivery_charge: r.delivery_charge ?? r.deliveryCharge ?? r.delivery_fee,
              adjustment: r.adjustment ?? r.adjust,
              note: r.note ?? r.remarks ?? r.remark
            }));

            // Extract pagination from common locations
            const pagination = raw?.pagination || raw?.meta || undefined;
            let normalizedPagination: any = undefined;
            if (pagination) {
              const total = pagination.total ?? pagination.totalItems;
              const perPage = pagination.pageSize ?? pagination.per_page ?? pagination.perPage;
              const currentPage = pagination.page ?? pagination.current_page ?? pagination.currentPage;
              const totalPages = pagination.totalPages ?? (total && perPage ? Math.ceil(total / perPage) : undefined);
              normalizedPagination = {
                page: currentPage || page || 1,
                pageSize: perPage || pageSize || items.length,
                total: total,
                totalPages: totalPages
              };
            }

            return { status: 200, data: items, pagination: normalizedPagination };
          } catch (err: any) {
            lastError = err;
            continue;
          }
        }
      }
    }

    if (lastError) throw lastError;
    return { status: 200, data: [] };
  }
}
