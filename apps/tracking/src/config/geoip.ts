import { Reader, type ReaderModel } from "@maxmind/geoip2-node"
import env from "./env.js"
import { logger } from "../lib/logger.js"

const log = logger({ module: "geoip" })

function createAsnReader(): ReaderModel | null {
  try {
    const reader = Reader.open(env.GEOIP_ASN_DB_PATH)
    return reader as unknown as ReaderModel
  } catch {
    log.warn("ASN database not found", { path: env.GEOIP_ASN_DB_PATH })
    return null
  }
}

let _reader: ReaderModel | null = null

export function getAsnReader(): ReaderModel | null {
  if (!_reader) {
    _reader = createAsnReader()
  }
  return _reader
}
