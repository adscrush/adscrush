import * as BunnyStorageSDK from "@bunny.net/storage-sdk"
import { ReadableStream } from "node:stream/web"
import type { StorageConfig, UploadResult, DownloadResult, FileInfo } from "./types"

export class StorageClient {
  private zone: BunnyStorageSDK.zone.StorageZone

  constructor(config: StorageConfig) {
    this.zone = BunnyStorageSDK.zone.connect_with_accesskey(
      (config.region ?? BunnyStorageSDK.regions.StorageRegion.Falkenstein) as BunnyStorageSDK.regions.StorageRegion,
      config.storageZone,
      config.apiKey,
    )
  }

  private buildStoragePath(prefix: string, fileName: string): string {
    const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "")
    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_")
    const ts = Date.now()
    const rand = Math.random().toString(36).substring(2, 8)
    return cleanPrefix ? `${cleanPrefix}/${ts}-${rand}-${cleanName}` : `${ts}-${rand}-${cleanName}`
  }

  private normalizePath(path: string): string {
    return path.startsWith("/") ? path : `/${path}`
  }

  async upload(
    prefix: string,
    fileName: string,
    file: Uint8Array,
    contentType?: string,
  ): Promise<UploadResult> {
    const storagePath = this.buildStoragePath(prefix, fileName)

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(file)
        controller.close()
      },
    })

    await BunnyStorageSDK.file.upload(this.zone, this.normalizePath(storagePath), stream, {
      ...(contentType ? { contentType } : {}),
    })

    return {
      cdnUrl: `/${storagePath}`,
      storagePath,
      fileSize: file.length,
    }
  }

  async download(path: string): Promise<DownloadResult> {
    const { stream, length } = await BunnyStorageSDK.file.download(this.zone, this.normalizePath(path))
    const reader = stream.getReader()
    const chunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    const data = concatUint8Arrays(chunks)
    return { data, length, path, contentType: "" }
  }

  async downloadStream(path: string): Promise<ReadableStream<Uint8Array>> {
    const { stream } = await BunnyStorageSDK.file.download(this.zone, this.normalizePath(path))
    return stream
  }

  async get(path: string): Promise<FileInfo> {
    const file = await BunnyStorageSDK.file.get(this.zone, this.normalizePath(path))
    return mapStorageFile(file)
  }

  async delete(storagePath: string): Promise<boolean> {
    return BunnyStorageSDK.file.remove(this.zone, this.normalizePath(storagePath))
  }

  async deleteDirectory(path: string): Promise<boolean> {
    return BunnyStorageSDK.file.removeDirectory(this.zone, this.normalizePath(path))
  }

  async list(prefix = ""): Promise<FileInfo[]> {
    const files = await BunnyStorageSDK.file.list(this.zone, this.normalizePath(prefix))
    return files.map(mapStorageFile)
  }
}

function mapStorageFile(f: BunnyStorageSDK.file.StorageFile): FileInfo {
  return {
    guid: f.guid,
    storageZoneName: f.storageZoneName,
    path: f.path,
    objectName: f.objectName,
    length: f.length,
    lastChanged: f.lastChanged.toISOString(),
    serverId: f.serverId,
    isDirectory: f.isDirectory,
    userId: f.userId,
    contentType: f.contentType,
    dateCreated: f.dateCreated.toISOString(),
    storageZoneId: f.storageZoneId,
    checksum: f.checksum,
    replicatedZones: f.replicatedZones,
  }
}

function concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }
  return result
}
