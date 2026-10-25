export interface InvoiceItem {
  id: string;
  name: string;
  unitPrice: number | '';
  quantity: number | '';
  total: number;
}

export type InvoiceType = 'sale' | 'purchase';

export interface InvoiceData {
  invoiceNumber: string;
  invoiceType: InvoiceType;
  invoiceDate: string;
  sellerName: string;
  sellerPhone?: string;
  buyerName: string;
  buyerPhone?: string;
  items: InvoiceItem[];
  discount: number | '';
  notes: string;
}
