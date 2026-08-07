export enum StorageRegion {
  Falkenstein = "de",
  London = "uk",
  NewYork = "ny",
  LosAngeles = "la",
  Singapore = "sg",
  Stockholm = "se",
  SaoPaulo = "br",
  Johannesburg = "jh",
  Sydney = "syd",
}

export interface StorageConfig {
  storageZone: string
  apiKey: string
  region?: StorageRegion
}

export interface CDNConfig {
  apiKey: string
  pullZoneUrl?: string
}

export interface UploadResult {
  cdnUrl: string
  storagePath: string
  fileSize: number
}

export interface DownloadResult {
  data: Uint8Array
  contentType: string
  length?: number
  path: string
}

export interface FileInfo {
  guid: string
  storageZoneName: string
  path: string
  objectName: string
  length: number
  lastChanged: string
  serverId: number
  isDirectory: boolean
  userId: string
  contentType: string
  dateCreated: string
  storageZoneId: number
  checksum: string | null
  replicatedZones: string[] | null
}
