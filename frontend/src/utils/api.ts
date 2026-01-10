import { invoke } from '@tauri-apps/api/core';
import type {
  Location,
  Item,
  LocationInput,
  ItemInput,
  ItemFilter,
  QRCodeResult,
  SyncResult,
} from '../types';

// Location APIs
export const getLocations = async (): Promise<Location[]> => {
  return invoke<Location[]>('get_locations');
};

export const createLocation = async (input: LocationInput): Promise<number> => {
  return invoke<number>('create_location', { input });
};

export const updateLocation = async (
  id: number,
  name: string,
  description?: string
): Promise<void> => {
  return invoke<void>('update_location', { id, name, description });
};

export const deleteLocation = async (id: number): Promise<void> => {
  return invoke<void>('delete_location', { id });
};

export const getLocationByQR = async (qrCodeId: string): Promise<Location> => {
  return invoke<Location>('get_location_by_qr', { qrCodeId });
};

// Item APIs
export const getItems = async (filter?: ItemFilter): Promise<Item[]> => {
  return invoke<Item[]>('get_items', { filter });
};

export const createItem = async (item: ItemInput): Promise<number> => {
  return invoke<number>('create_item', { item });
};

export const updateItem = async (id: number, item: ItemInput): Promise<void> => {
  return invoke<void>('update_item', { id, item });
};

export const deleteItem = async (id: number): Promise<void> => {
  return invoke<void>('delete_item', { id });
};

export const updateQuantity = async (
  itemId: number,
  change: number,
  operationType: string
): Promise<void> => {
  return invoke<void>('update_quantity', {
    itemId,
    change,
    operationType,
  });
};

// QR Code APIs
export const generateLocationQR = async (locationId: number): Promise<string> => {
  return invoke<string>('generate_location_qr', { locationId });
};

export const generateBatchQR = async (
  locationIds: number[]
): Promise<QRCodeResult[]> => {
  return invoke<QRCodeResult[]>('generate_batch_qr', { locationIds });
};

// PDF APIs
export const generatePdfLabels = async (
  itemIds: number[],
  paperSize: string,
  columns: number,
  rows: number
): Promise<string> => {
  return invoke<string>('generate_pdf_labels', {
    itemIds,
    paperSize,
    columns,
    rows,
  });
};

// Image APIs
export const generateImageLabels = async (
  itemIds: number[],
  columns: number,
  rows: number
): Promise<string> => {
  return invoke<string>('generate_image_labels', {
    itemIds,
    columns,
    rows,
  });
};

// Sync APIs
export const configureWebDAV = async (
  url: string,
  username: string,
  password: string,
  path: string
): Promise<void> => {
  return invoke<void>('configure_webdav', { url, username, password, path });
};

export const configureS3 = async (
  bucket: string,
  region: string,
  accessKey: string,
  secretKey: string,
  endpoint?: string
): Promise<void> => {
  return invoke<void>('configure_s3', {
    bucket,
    region,
    accessKey,
    secretKey,
    endpoint,
  });
};

export const syncUpload = async (syncType: string): Promise<SyncResult> => {
  return invoke<SyncResult>('sync_upload', { syncType });
};

export const syncDownload = async (syncType: string): Promise<SyncResult> => {
  return invoke<SyncResult>('sync_download', { syncType });
};
