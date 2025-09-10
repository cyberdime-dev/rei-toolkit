/**
 * Storage Compression Utilities for REI Toolkit
 * 
 * Provides data compression and decompression for localStorage optimization
 * Uses LZ-string algorithm for efficient text compression
 */

/**
 * Simple LZ-string implementation for client-side compression
 * Based on LZ-string algorithm, optimized for localStorage usage
 */
class LZString {
  static _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

  /**
   * Compress string data
   */
  static compress(uncompressed) {
    if (uncompressed == null) return ""
    
    let i, value
    const context_dictionary = {}
    const context_dictionaryToCreate = {}
    let context_c = ""
    let context_wc = ""
    let context_w = ""
    let context_enlargeIn = 2
    let context_dictSize = 3
    let context_numBits = 2
    const context_data = []
    let context_data_val = 0
    let context_data_position = 0

    for (let ii = 0; ii < uncompressed.length; ii += 1) {
      context_c = uncompressed.charAt(ii)
      if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
        context_dictionary[context_c] = context_dictSize++
        context_dictionaryToCreate[context_c] = true
      }

      context_wc = context_w + context_c
      if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
        context_w = context_wc
      } else {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1)
              if (context_data_position == 15) {
                context_data_position = 0
                context_data.push(this._getCharFromInt(context_data_val))
                context_data_val = 0
              } else {
                context_data_position++
              }
            }
            value = context_w.charCodeAt(0)
            for (i = 0; i < 8; i++) {
              context_data_val = (context_data_val << 1) | (value & 1)
              if (context_data_position == 15) {
                context_data_position = 0
                context_data.push(this._getCharFromInt(context_data_val))
                context_data_val = 0
              } else {
                context_data_position++
              }
              value = value >> 1
            }
          } else {
            value = 1
            for (i = 0; i < context_numBits; i++) {
              context_data_val = (context_data_val << 1) | value
              if (context_data_position == 15) {
                context_data_position = 0
                context_data.push(this._getCharFromInt(context_data_val))
                context_data_val = 0
              } else {
                context_data_position++
              }
              value = 0
            }
            value = context_w.charCodeAt(0)
            for (i = 0; i < 16; i++) {
              context_data_val = (context_data_val << 1) | (value & 1)
              if (context_data_position == 15) {
                context_data_position = 0
                context_data.push(this._getCharFromInt(context_data_val))
                context_data_val = 0
              } else {
                context_data_position++
              }
              value = value >> 1
            }
          }
          context_enlargeIn--
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits)
            context_numBits++
          }
          delete context_dictionaryToCreate[context_w]
        } else {
          value = context_dictionary[context_w]
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position == 15) {
              context_data_position = 0
              context_data.push(this._getCharFromInt(context_data_val))
              context_data_val = 0
            } else {
              context_data_position++
            }
            value = value >> 1
          }
        }
        context_enlargeIn--
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits)
          context_numBits++
        }
        context_dictionary[context_wc] = context_dictSize++
        context_w = String(context_c)
      }
    }

    if (context_w !== "") {
      if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
        if (context_w.charCodeAt(0) < 256) {
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1)
            if (context_data_position == 15) {
              context_data_position = 0
              context_data.push(this._getCharFromInt(context_data_val))
              context_data_val = 0
            } else {
              context_data_position++
            }
          }
          value = context_w.charCodeAt(0)
          for (i = 0; i < 8; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position == 15) {
              context_data_position = 0
              context_data.push(this._getCharFromInt(context_data_val))
              context_data_val = 0
            } else {
              context_data_position++
            }
            value = value >> 1
          }
        } else {
          value = 1
          for (i = 0; i < context_numBits; i++) {
            context_data_val = (context_data_val << 1) | value
            if (context_data_position == 15) {
              context_data_position = 0
              context_data.push(this._getCharFromInt(context_data_val))
              context_data_val = 0
            } else {
              context_data_position++
            }
            value = 0
          }
          value = context_w.charCodeAt(0)
          for (i = 0; i < 16; i++) {
            context_data_val = (context_data_val << 1) | (value & 1)
            if (context_data_position == 15) {
              context_data_position = 0
              context_data.push(this._getCharFromInt(context_data_val))
              context_data_val = 0
            } else {
              context_data_position++
            }
            value = value >> 1
          }
        }
        context_enlargeIn--
        if (context_enlargeIn == 0) {
          context_enlargeIn = Math.pow(2, context_numBits)
          context_numBits++
        }
        delete context_dictionaryToCreate[context_w]
      } else {
        value = context_dictionary[context_w]
        for (i = 0; i < context_numBits; i++) {
          context_data_val = (context_data_val << 1) | (value & 1)
          if (context_data_position == 15) {
            context_data_position = 0
            context_data.push(this._getCharFromInt(context_data_val))
            context_data_val = 0
          } else {
            context_data_position++
          }
          value = value >> 1
        }
      }
      context_enlargeIn--
      if (context_enlargeIn == 0) {
        context_enlargeIn = Math.pow(2, context_numBits)
        context_numBits++
      }
    }

    value = 2
    for (i = 0; i < context_numBits; i++) {
      context_data_val = (context_data_val << 1) | (value & 1)
      if (context_data_position == 15) {
        context_data_position = 0
        context_data.push(this._getCharFromInt(context_data_val))
        context_data_val = 0
      } else {
        context_data_position++
      }
      value = value >> 1
    }

    while (true) {
      context_data_val = (context_data_val << 1)
      if (context_data_position == 15) {
        context_data.push(this._getCharFromInt(context_data_val))
        break
      } else context_data_position++
    }
    return context_data.join('')
  }

  /**
   * Decompress string data
   */
  static decompress(compressed) {
    if (compressed == null) return ""
    if (compressed == "") return null
    
    const dictionary = [0, 1, 2]
    let enlargeIn = 4, dictSize = 4, numBits = 3
    let entry = ""
    const result = []
    let w, bits, resb, maxpower, power
    let c
    const data = { string: compressed, val: 0, position: 32768, index: 1 }

    bits = 0
    maxpower = Math.pow(2, 2)
    power = 1
    while (power != maxpower) {
      resb = data.val & data.position
      data.position >>= 1
      if (data.position == 0) {
        data.position = 32768
        data.val = data.string.charCodeAt(data.index++)
      }
      bits |= (resb > 0 ? 1 : 0) * power
      power <<= 1
    }

    switch (bits) {
      case 0:
        bits = 0
        maxpower = Math.pow(2, 8)
        power = 1
        while (power != maxpower) {
          resb = data.val & data.position
          data.position >>= 1
          if (data.position == 0) {
            data.position = 32768
            data.val = data.string.charCodeAt(data.index++)
          }
          bits |= (resb > 0 ? 1 : 0) * power
          power <<= 1
        }
        c = String.fromCharCode(bits)
        break
      case 1:
        bits = 0
        maxpower = Math.pow(2, 16)
        power = 1
        while (power != maxpower) {
          resb = data.val & data.position
          data.position >>= 1
          if (data.position == 0) {
            data.position = 32768
            data.val = data.string.charCodeAt(data.index++)
          }
          bits |= (resb > 0 ? 1 : 0) * power
          power <<= 1
        }
        c = String.fromCharCode(bits)
        break
      case 2:
        return ""
    }
    dictionary[3] = c
    w = c
    result.push(c)
    while (true) {
      if (data.index > data.string.length) {
        return ""
      }

      bits = 0
      maxpower = Math.pow(2, numBits)
      power = 1
      while (power != maxpower) {
        resb = data.val & data.position
        data.position >>= 1
        if (data.position == 0) {
          data.position = 32768
          data.val = data.string.charCodeAt(data.index++)
        }
        bits |= (resb > 0 ? 1 : 0) * power
        power <<= 1
      }

      switch (c = bits) {
        case 0:
          bits = 0
          maxpower = Math.pow(2, 8)
          power = 1
          while (power != maxpower) {
            resb = data.val & data.position
            data.position >>= 1
            if (data.position == 0) {
              data.position = 32768
              data.val = data.string.charCodeAt(data.index++)
            }
            bits |= (resb > 0 ? 1 : 0) * power
            power <<= 1
          }

          dictionary[dictSize++] = String.fromCharCode(bits)
          c = dictSize - 1
          enlargeIn--
          break
        case 1:
          bits = 0
          maxpower = Math.pow(2, 16)
          power = 1
          while (power != maxpower) {
            resb = data.val & data.position
            data.position >>= 1
            if (data.position == 0) {
              data.position = 32768
              data.val = data.string.charCodeAt(data.index++)
            }
            bits |= (resb > 0 ? 1 : 0) * power
            power <<= 1
          }
          dictionary[dictSize++] = String.fromCharCode(bits)
          c = dictSize - 1
          enlargeIn--
          break
        case 2:
          return result.join('')
      }

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits)
        numBits++
      }

      if (dictionary[c]) {
        entry = dictionary[c]
      } else {
        if (c === dictSize) {
          entry = w + w.charAt(0)
        } else {
          return null
        }
      }
      result.push(entry)

      dictionary[dictSize++] = w + entry.charAt(0)
      enlargeIn--

      w = entry

      if (enlargeIn == 0) {
        enlargeIn = Math.pow(2, numBits)
        numBits++
      }
    }
  }

  static _getCharFromInt(a) {
    return String.fromCharCode(a + 32)
  }
}

/**
 * Compression configuration
 */
const COMPRESSION_CONFIG = {
  // Minimum size threshold for compression (bytes)
  MIN_SIZE_FOR_COMPRESSION: 1024, // 1KB
  // Compression ratio threshold (if compression ratio is worse, don't compress)
  MIN_COMPRESSION_RATIO: 0.9, // 10% reduction minimum
  // Compression metadata prefix
  COMPRESSED_PREFIX: '__COMPRESSED__',
  // Version for compression format
  COMPRESSION_VERSION: '1.0',
}

/**
 * Storage Compression Manager
 */
export class StorageCompressionManager {
  /**
   * Compress data if beneficial
   */
  static compressData(data) {
    try {
      const originalData = typeof data === 'string' ? data : JSON.stringify(data)
      const originalSize = originalData.length

      // Don't compress small data
      if (originalSize < COMPRESSION_CONFIG.MIN_SIZE_FOR_COMPRESSION) {
        return {
          compressed: false,
          data: originalData,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
        }
      }

      // Compress the data
      const compressedData = LZString.compress(originalData)
      const compressedSize = compressedData.length

      // Calculate compression ratio
      const compressionRatio = compressedSize / originalSize

      // Check if compression is beneficial
      if (compressionRatio > COMPRESSION_CONFIG.MIN_COMPRESSION_RATIO) {
        return {
          compressed: false,
          data: originalData,
          originalSize,
          compressedSize: originalSize,
          compressionRatio: 1,
          reason: 'Compression not beneficial',
        }
      }

      // Create compressed wrapper
      const compressedWrapper = {
        [COMPRESSION_CONFIG.COMPRESSED_PREFIX]: true,
        version: COMPRESSION_CONFIG.COMPRESSION_VERSION,
        originalSize,
        compressedSize,
        compressionRatio,
        compressedAt: new Date().toISOString(),
        data: compressedData,
      }

      return {
        compressed: true,
        data: JSON.stringify(compressedWrapper),
        originalSize,
        compressedSize: JSON.stringify(compressedWrapper).length,
        compressionRatio,
      }

    } catch (error) {
      console.warn('Compression failed:', error)
      const fallbackData = typeof data === 'string' ? data : JSON.stringify(data)
      return {
        compressed: false,
        data: fallbackData,
        originalSize: fallbackData.length,
        compressedSize: fallbackData.length,
        compressionRatio: 1,
        error: error.message,
      }
    }
  }

  /**
   * Decompress data if compressed
   */
  static decompressData(data) {
    try {
      if (typeof data !== 'string') {
        return {
          decompressed: false,
          data,
          error: 'Data is not a string',
        }
      }

      // Try to parse as JSON to check if it's compressed
      let parsedData
      try {
        parsedData = JSON.parse(data)
      } catch {
        // Not JSON, return as-is
        return {
          decompressed: false,
          data,
        }
      }

      // Check if it's compressed data
      if (!parsedData || typeof parsedData !== 'object' || !parsedData[COMPRESSION_CONFIG.COMPRESSED_PREFIX]) {
        return {
          decompressed: false,
          data,
        }
      }

      // Decompress the data
      const decompressedData = LZString.decompress(parsedData.data)

      if (decompressedData === null) {
        throw new Error('Decompression failed')
      }

      return {
        decompressed: true,
        data: decompressedData,
        originalSize: parsedData.originalSize,
        compressedSize: parsedData.compressedSize,
        compressionRatio: parsedData.compressionRatio,
        compressedAt: parsedData.compressedAt,
        version: parsedData.version,
      }

    } catch (error) {
      console.warn('Decompression failed:', error)
      return {
        decompressed: false,
        data,
        error: error.message,
      }
    }
  }

  /**
   * Check if data is compressed
   */
  static isCompressed(data) {
    try {
      if (typeof data !== 'string') return false
      
      const parsedData = JSON.parse(data)
      return parsedData && typeof parsedData === 'object' && parsedData[COMPRESSION_CONFIG.COMPRESSED_PREFIX] === true
    } catch {
      return false
    }
  }

  /**
   * Get compression statistics for data
   */
  static getCompressionStats(data) {
    const originalData = typeof data === 'string' ? data : JSON.stringify(data)
    const originalSize = originalData.length

    if (originalSize < COMPRESSION_CONFIG.MIN_SIZE_FOR_COMPRESSION) {
      return {
        canCompress: false,
        reason: 'Too small for compression',
        originalSize,
        estimatedCompressedSize: originalSize,
        estimatedSavings: 0,
        estimatedRatio: 1,
      }
    }

    // Estimate compression by compressing a sample
    const sampleSize = Math.min(originalSize, 1000)
    const sample = originalData.substring(0, sampleSize)
    const compressedSample = LZString.compress(sample)
    const sampleRatio = compressedSample.length / sample.length

    const estimatedCompressedSize = Math.ceil(originalSize * sampleRatio)
    const estimatedSavings = originalSize - estimatedCompressedSize
    const worthCompressing = sampleRatio < COMPRESSION_CONFIG.MIN_COMPRESSION_RATIO

    return {
      canCompress: worthCompressing,
      reason: worthCompressing ? 'Compression beneficial' : 'Compression not beneficial',
      originalSize,
      estimatedCompressedSize,
      estimatedSavings,
      estimatedRatio: sampleRatio,
      estimatedSavingsPercent: Math.round((estimatedSavings / originalSize) * 100),
    }
  }

  /**
   * Compress multiple items and return statistics
   */
  static compressBatch(items) {
    const results = []
    let totalOriginalSize = 0
    let totalCompressedSize = 0
    let compressedCount = 0

    for (const [key, value] of Object.entries(items)) {
      const result = this.compressData(value)
      results.push({
        key,
        ...result,
      })

      totalOriginalSize += result.originalSize
      totalCompressedSize += result.compressedSize || result.originalSize
      if (result.compressed) compressedCount++
    }

    return {
      results,
      summary: {
        totalItems: results.length,
        compressedItems: compressedCount,
        totalOriginalSize,
        totalCompressedSize,
        totalSavings: totalOriginalSize - totalCompressedSize,
        overallCompressionRatio: totalCompressedSize / totalOriginalSize,
        averageSavingsPercent: Math.round(((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100),
      },
    }
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }
}

/**
 * Export utilities for direct use
 */
export const compressionUtils = {
  /**
   * Quick compress if beneficial
   */
  compress: StorageCompressionManager.compressData,

  /**
   * Quick decompress
   */
  decompress: StorageCompressionManager.decompressData,

  /**
   * Check if compressed
   */
  isCompressed: StorageCompressionManager.isCompressed,

  /**
   * Get compression stats
   */
  getStats: StorageCompressionManager.getCompressionStats,

  /**
   * Format bytes
   */
  formatBytes: StorageCompressionManager.formatBytes,
}

// Default export
export default StorageCompressionManager
