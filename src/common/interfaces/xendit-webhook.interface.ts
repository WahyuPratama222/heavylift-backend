export interface XenditWebhookPayload {
  id: string;
  status: string;
  payment_method: string;
  paid_at: string;
  [key: string]: unknown;
}
