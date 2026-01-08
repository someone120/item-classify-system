export interface Location {
  id: number;
  name: string;
  parent_id: number | null;
  location_type: 'shelf' | 'box' | 'compartment';
  description?: string;
  qr_code_id?: string;
  created_at: string;
  updated_at: string;
  children?: Location[];
}

export interface Item {
  id: number;
  name: string;
  category?: string;
  specifications?: string;
  quantity: number;
  unit?: string;
  location_id?: number;
  min_quantity?: number;
  notes?: string;
  image_path?: string;
  created_at: string;
  updated_at: string;
  location?: Location;
}

export interface InventoryLog {
  id: number;
  item_id: number;
  quantity_change: number;
  quantity_after: number;
  operation_type: 'add' | 'remove' | 'adjust';
  source: string;
  notes?: string;
  created_at: string;
}

export interface LocationInput {
  name: string;
  parent_id?: number;
  location_type: 'shelf' | 'box' | 'compartment';
  description?: string;
}

export interface ItemInput {
  name: string;
  category?: string;
  specifications?: string;
  quantity: number;
  unit?: string;
  location_id?: number;
  min_quantity?: number;
  notes?: string;
  image_path?: string;
}

export interface ItemFilter {
  category?: string;
  location_id?: number;
  search?: string;
}

export interface QRCodeResult {
  id: number;
  qr_data: string;
  name: string;
}

export interface SyncConfig {
  id: number;
  sync_type: 'webdav' | 's3';
  enabled: boolean;
  config: Record<string, any>;
  last_sync_time?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
}
