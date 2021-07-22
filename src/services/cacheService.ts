import {RestUtils} from './restUtils';
import {Either, left, right} from './either';
import {CacheConfigUtils, ContentType, EncodingType,} from '@services/cacheConfigUtils';
import {ContentTypeHeaderMapper} from '@services/contentTypeHeaderMapper';
import {ProtobufDataUtils} from '@services/protobufDataUtils';

/**
 * Cache Service calls Infinispan endpoints related to Caches
 * @author Katia Aresti
 * @since 1.0
 */
export class CacheService {
  endpoint: string;
  utils: RestUtils;

  constructor(endpoint: string, restUtils: RestUtils) {
    this.endpoint = endpoint;
    this.utils = restUtils;
  }

  /**
   * Retrieves all the properties to be displayed in the cache detail in a single rest call
   *
   * @param cacheName
   */
  public retrieveFullDetail(
    cacheName: string
  ): Promise<Either<ActionResponse, DetailedInfinispanCache>> {
    return this.utils.get(
      this.endpoint + '/caches/' + encodeURIComponent(cacheName),
      (data) => {
        let cacheStats;
        if (data['stats']) {
          cacheStats = <CacheStats>{
            enabled: data.statistics,
            misses: data.stats.misses,
            time_since_start: data.stats.time_since_start,
            time_since_reset: data.stats.time_since_reset,
            hits: data.stats.hits,
            current_number_of_entries: data.stats.current_number_of_entries,
            current_number_of_entries_in_memory:
              data.stats.current_number_of_entries_in_memory,
            total_number_of_entries: data.stats.total_number_of_entries,
            stores: data.stats.stores,
            off_heap_memory_used: data.stats.off_heap_memory_used,
            data_memory_used: data.stats.data_memory_used,
            retrievals: data.stats.retrievals,
            remove_hits: data.stats.remove_hits,
            remove_misses: data.stats.remove_misses,
            evictions: data.stats.evictions,
            average_read_time: data.stats.average_read_time,
            average_read_time_nanos: data.stats.average_read_time_nanos,
            average_write_time: data.stats.average_write_time,
            average_write_time_nanos: data.stats.average_write_time_nanos,
            average_remove_time: data.stats.average_remove_time,
            average_remove_time_nanos: data.stats.average_remove_time_nanos,
            required_minimum_number_of_nodes:
              data.stats.required_minimum_number_of_nodes,
          };
        }

        let keyValueEncoding = CacheConfigUtils.mapEncoding(data.configuration);
        return <DetailedInfinispanCache>{
          name: cacheName,
          started: true,
          type: CacheConfigUtils.mapCacheType(data.configuration),
          encoding: keyValueEncoding,
          size: data['size'],
          rehash_in_progress: data['rehash_in_progress'],
          indexing_in_progress: data['indexing_in_progress'],
          editable: CacheConfigUtils.isEditable(keyValueEncoding[1]),
          queryable: data.queryable,
          features: <Features>{
            bounded: data.bounded,
            indexed: data.indexed,
            persistent: data.persistent,
            transactional: data.transactional,
            secured: data.secured,
            hasRemoteBackup: data['has_remote_backup'],
          },
          configuration: <CacheConfig>{
            name: cacheName,
            config: JSON.stringify(data.configuration, null, 2),
          },
          stats: cacheStats,
        };
      }
    );
  }

  /**
   * Creates a cache by configuration name.
   * The template must be present in the server
   *
   * @param cacheName, the cache name
   * @param configName, the template name
   */
  public async createCacheByConfigName(
    cacheName: string,
    configName: string
  ): Promise<ActionResponse> {
    const createCacheByConfig =
      this.endpoint +
      '/caches/' +
      encodeURIComponent(cacheName) +
      '?template=' +
      encodeURIComponent(configName);

    return this.utils.post({
      url: createCacheByConfig,
      successMessage: `Cache ${cacheName} successfully created with ${configName}.`,
      errorMessage: `Unexpected error when creating cache ${configName}.`,
    });
  }

  /**
   * Create a cache with the configuration provided.
   * Config can be in json or xml format
   *
   * @param cacheName, the cache name
   * @param config, the configuration to send in the body
   */
  public async createCacheWithConfiguration(
    cacheName: string,
    config: string
  ): Promise<ActionResponse> {
    let contentType = ContentType.JSON;
    try {
      JSON.parse(config);
    } catch (e) {
      contentType = ContentType.XML;
    }
    let customHeaders = this.utils.createAuthenticatedHeader();
    customHeaders.append(
      'Content-Type',
      ContentTypeHeaderMapper.fromContentType(contentType)
    );

    const urlCreateCache =
      this.endpoint + '/caches/' + encodeURIComponent(cacheName);
    return this.utils.post({
      url: urlCreateCache,
      successMessage: `Cache ${cacheName} created with the provided configuration.`,
      errorMessage:
        'Unexpected error creating the cache with the provided configuration.',
      customHeaders: customHeaders,
      body: config,
    });
  }

  /**
   * Delete cache by name
   *
   * @param cacheName, to be deleted if such exists
   */
  public async deleteCache(cacheName: string): Promise<ActionResponse> {
    return this.utils.delete({
      url: this.endpoint + '/caches/' + encodeURIComponent(cacheName),
      successMessage: `Cache ${cacheName} deleted.`,
      errorMessage: `Unexpected error deleting cache ${cacheName}.`,
    });
  }

  /**
   * Ignore cache by name
   *
   * @param cacheName, to be deleted if such exists
   */
  public async ignoreCache(
    cacheManager: string,
    cacheName: string
  ): Promise<ActionResponse> {
    return this.utils.post({
      url:
        this.endpoint +
        '/server/ignored-caches/' +
        cacheManager +
        '/' +
        encodeURIComponent(cacheName),
      successMessage: `Cache ${cacheName} hidden.`,
      errorMessage: `Unexpected error hidding cache ${cacheName}.`,
    });
  }

  /**
   * Undo ignore cache by name
   *
   * @param cacheName, to be deleted if such exists
   */
  public async undoIgnoreCache(
    cacheManager: string,
    cacheName: string
  ): Promise<ActionResponse> {
    return this.utils.delete({
      url:
        this.endpoint +
        '/server/ignored-caches/' +
        cacheManager +
        '/' +
        encodeURIComponent(cacheName),
      successMessage: `Cache ${cacheName} is now visible.`,
      errorMessage: `Unexpected error making cache ${cacheName} visible again.`,
    });
  }

  /**
   * Add or Update an entry
   *
   * @param cacheName
   * @param key
   * @param keyContentType
   * @param value
   * @param valueContentType
   * @param maxIdle
   * @param timeToLive
   * @param flags
   */
  public async createOrUpdate(
    cacheName: string,
    cacheEncoding: CacheEncoding,
    key: string,
    keyContentType: ContentType,
    value: string,
    valueContentType: ContentType,
    maxIdle: string,
    timeToLive: string,
    flags: string[],
    create: boolean
  ): Promise<ActionResponse> {
    let headers = this.utils.createAuthenticatedHeader();

    let keyContentTypeHeader;
    if (cacheEncoding.key == EncodingType.XML) {
      keyContentTypeHeader = ContentTypeHeaderMapper.fromContentType(ContentType.XML);
    }

    if (cacheEncoding.key == EncodingType.JSON) {
      keyContentTypeHeader = ContentTypeHeaderMapper.fromContentType(ContentType.JSON);
    }

    if (cacheEncoding.value == EncodingType.Protobuf) {
      keyContentTypeHeader = ContentTypeHeaderMapper.fromContentType(keyContentType);
    }

    let contentTypeHeader;
    if (cacheEncoding.value == EncodingType.XML) {
      contentTypeHeader = ContentTypeHeaderMapper.fromContentType(ContentType.XML);
    }

    if (cacheEncoding.value == EncodingType.JSON) {
      contentTypeHeader = ContentTypeHeaderMapper.fromContentType(ContentType.JSON);
    }

    if (cacheEncoding.value == EncodingType.Protobuf) {
      contentTypeHeader = ContentTypeHeaderMapper.fromContentType(valueContentType);
    }

    // if (valueContentType) {
    //   headers.append(
    //     'Key-Content-Type',
    //     EncodingUtility.fromContentType(keyContentType)
    //   );
    // } else if (CacheConfigUtils.isJSONObject(key)) {
    //   headers.append(
    //     'Key-Content-Type',
    //     EncodingUtility.fromContentType(ContentType.JSON)
    //   );
    //   key = JSON.parse(key);
    // }

    // let contentTypeHeader;
    // if (
    //   CacheConfigUtils.isJSONObject(value) &&
    //   valueContentType == ContentType.StringContentType
    // ) {
    //   contentTypeHeader = EncodingUtility.fromContentType(ContentType.JSON);
    // } else if (valueContentType) {
    //   contentTypeHeader = EncodingUtility.fromContentType(valueContentType);
    // } else {
    //   contentTypeHeader = EncodingUtility.fromContentType(
    //     ContentType.StringContentType
    //   );
    // }

    headers.append('Key-Content-Type', keyContentTypeHeader);
    headers.append('Content-Type', contentTypeHeader);

    if (keyContentType == ContentType.JSON && isNaN(Number(key))) {
      key = '"' + key + '"';
    }

    if (valueContentType == ContentType.JSON && isNaN(Number(value))) {
      value = '"' + value + '"';
    }

    if (timeToLive.length > 0) {
      headers.append('timeToLiveSeconds', timeToLive);
    }
    if (maxIdle.length > 0) {
      headers.append('maxIdleTimeSeconds', maxIdle);
    }
    if (flags.length > 0) {
      headers.append('flags', flags.join(','));
    }

    const urlCreateOrUpdate =
      this.endpoint +
      '/caches/' +
      encodeURIComponent(cacheName) +
      '/' +
      encodeURIComponent(key);

    return create
      ? this.utils.post({
          url: urlCreateOrUpdate,
          successMessage: `Entry added to cache ${cacheName}.`,
          errorMessage: `Unexpected error creating an entry in cache ${cacheName}.`,
          customHeaders: headers,
          body: value,
        })
      : this.utils.put({
          url: urlCreateOrUpdate,
          successMessage: `Entry updated in cache ${cacheName}.`,
          errorMessage: `Unexpected error updating an entry in cache ${cacheName}.`,
          customHeaders: headers,
          body: value,
        });
  }

  /**
   * List of entries
   *
   * @param cacheName, the cache name
   * @param limit, maximum number of entries to be retrieved
   */
  public async getEntries(
    cacheName: string,
    encoding: CacheEncoding,
    limit: string
  ): Promise<Either<ActionResponse, CacheEntry[]>> {
    const entriesUrl =
      this.endpoint +
      '/caches/' +
      encodeURIComponent(cacheName) +
      '?action=entries&content-negotiation=true&metadata=true&limit=' +
      limit;

    return this.utils.get(entriesUrl, (data) =>
      data.map(
        (entry) =>
          <CacheEntry>{
            key: this.extractKey(entry.key, encoding.key as EncodingType),
            keyContentType: this.extractContentType(
              entry.key,
              encoding.key as EncodingType
            ),
            value: this.extractValue(
              entry.value,
              encoding.value as EncodingType
            ),
            valueContentType: this.extractContentType(
              entry.value,
              encoding.value as EncodingType
            ),
            timeToLive: this.parseMetadataNumber(entry.timeToLiveSeconds),
            maxIdle: this.parseMetadataNumber(entry.maxIdleTimeSeconds),
            created: this.parseMetadataDate(entry.created),
            lastUsed: this.parseMetadataDate(entry.lastUsed),
            expires: this.parseMetadataDate(entry.expireTime),
          }
      ));
  }

  private extractKey(key: string, keyEncoding: EncodingType): string {
    if (keyEncoding == EncodingType.JSON) {
      return JSON.stringify(key);
    }

    if (keyEncoding == EncodingType.Protobuf) {
      const keyValue = key['_value'];
      if (
        CacheConfigUtils.isJSONObject(keyValue) &&
        !ProtobufDataUtils.isProtobufBasicType(key['_type'])
      ) {
        return JSON.stringify(keyValue);
      }
      return keyValue.toString();
    }

    return key.toString();
  }

  private extractValue(value: any, encoding: EncodingType): string {
    if (encoding == EncodingType.XML) {
      return value;
    }

    if (encoding == EncodingType.JSON) {
      return JSON.stringify(value);
    }

    return JSON.stringify(value);
  }

  private extractContentType(
    content: any,
    encodingType: EncodingType
  ): ContentType {
    if (encodingType == EncodingType.XML) {
      return ContentType.XML;
    }
    if (encodingType == EncodingType.JSON) {
      return ContentType.JSON;
    }
    if (encodingType == EncodingType.Protobuf) {
      return ProtobufDataUtils.fromProtobufType(content['_type']);
    }
    return ContentType.StringContentType;
  }

  /**
   * Get entry by key
   * @param cacheName
   * @param key
   * @param keyContentType
   * @return Entry or ActionResponse
   */
  public async getEntry(
    cacheName: string,
    encoding: CacheEncoding,
    key: string,
    keyContentType?: ContentType
  ): Promise<Either<ActionResponse, CacheEntry>> {
    let headers = this.utils.createAuthenticatedHeader();
    if (keyContentType) {
      let keyContentTypeHeader = ContentTypeHeaderMapper.fromContentType(
        keyContentType
      );
      headers.append('Key-Content-Type', keyContentTypeHeader);
      headers.append(
        'Content-Type',
        ContentTypeHeaderMapper.fromContentType(ContentType.JSON)
      );
    }
    const getEntryUrl =
      this.endpoint +
      '/caches/' +
      encodeURIComponent(cacheName) +
      '/' +
      encodeURIComponent(key);

    return this.utils
      .restCall(getEntryUrl, 'GET', headers)
      .then((response) => {
        if (response.ok) {
          return response.text().then((value) => {
            let valueContentType = this.extractContentType(
              value,
              encoding.value as EncodingType
            );
            // if (isNaN(Number(value)) && CacheConfigUtils.isJSONObject(value)) {
            //   valueContentType = ContentType.JSON;
            // }

            const timeToLive = response.headers.get('timeToLiveSeconds');
            const maxIdleTimeSeconds = response.headers.get(
              'maxIdleTimeSeconds'
            );
            const created = response.headers.get('created');
            const lastUsed = response.headers.get('lastUsed');
            const lastModified = response.headers.get('Last-Modified');
            const expires = response.headers.get('Expires');
            const cacheControl = response.headers.get('Cache-Control');
            const etag = response.headers.get('Etag');
            return <CacheEntry>{
              key: this.extractKey(key, encoding.key as EncodingType),
              value: this.extractValue(value, encoding.value as EncodingType),
              keyContentType: keyContentType,
              valueContentType: valueContentType,
              timeToLive: this.parseMetadataNumber(timeToLive),
              maxIdle: this.parseMetadataNumber(maxIdleTimeSeconds),
              created: this.parseMetadataDate(created),
              lastUsed: this.parseMetadataDate(lastUsed),
              lastModified: lastModified
                ? this.parseMetadataDate(Date.parse(lastModified))
                : undefined,
              expires: expires
                ? this.parseMetadataDate(Date.parse(expires))
                : undefined,
              cacheControl: cacheControl,
              eTag: etag,
            };
          });
        }

        if(response.status == 404) {
          throw `The entry key \' ${key} \' does not exist.`;
        }
        return response.text().then((text) => {
          throw text;
        });
      })
      .then((data) => right(data) as Either<ActionResponse, CacheEntry>)
      .catch((err) => {
        return left(
          this.utils.mapError(err, 'An error occurred retrieving key ' + key)
        );
      });
  }

  private parseMetadataNumber(
    entryMetadata: number | undefined | null | string
  ): string | undefined {
    if (!entryMetadata || entryMetadata == -1 || entryMetadata == '-1') {
      return undefined;
    }
    let entryMetadataNumber: number;
    if (Number.isInteger(entryMetadata)) {
      entryMetadataNumber = entryMetadata as number;
    } else {
      entryMetadataNumber = Number.parseInt(entryMetadata as string);
    }
    return entryMetadataNumber.toLocaleString('en', {
      maximumFractionDigits: 0,
    });
  }

  private parseMetadataDate(
    entryMetadata: string | number | undefined | null
  ): string | undefined {
    if (!entryMetadata || entryMetadata == -1 || entryMetadata == '-1') {
      return undefined;
    }

    let entryMetadataNumber: number;

    if (Number.isInteger(entryMetadata)) {
      entryMetadataNumber = entryMetadata as number;
    } else {
      entryMetadataNumber = Number.parseInt(entryMetadata as string);
    }
    return new Date(entryMetadataNumber).toLocaleString();
  }

  /**
   * Clear cache
   * @param cacheName, the name of the cache
   */
  public async clear(cacheName: string): Promise<ActionResponse> {
    const clearUrl =
      this.endpoint +
      '/caches/' +
      encodeURIComponent(cacheName) +
      '?action=clear';
    return this.utils.post({
      url: clearUrl,
      successMessage: `Cache ${cacheName} cleared.`,
      errorMessage: `Unexpected error when clearing the cache ${cacheName}.`,
    });
  }

  /**
   * Delete entry from cache
   *
   * @param cacheName, cache name
   * @param entryKey, entry key
   */
  public async deleteEntry(
    cacheName: string,
    entryKey: string,
    keyContentType: ContentType
  ): Promise<ActionResponse> {
    let headers = this.utils.createAuthenticatedHeader();
    let keyContentTypeHeader = ContentTypeHeaderMapper.fromContentType(keyContentType);
    headers.append('Key-Content-Type', keyContentTypeHeader);

    const deleteUrl =
      this.endpoint +
      '/caches/' +
      encodeURIComponent(cacheName) +
      '/' +
      encodeURIComponent(entryKey);

    return this.utils.delete({
      url: deleteUrl,
      successMessage: `Entry ${entryKey} deleted.`,
      errorMessage: 'Unexpected error deleting the entry.',
      customHeaders: headers,
    });
  }

  /**
   * Retrieve cache configuration
   *
   * @param cacheName
   */
  public async getConfiguration(
    cacheName: string
  ): Promise<Either<ActionResponse, CacheConfig>> {
    return this.utils.get(
      this.endpoint +
        '/caches/' +
        encodeURIComponent(cacheName) +
        '?action=config',
      (data) =>
        <CacheConfig>{
          name: cacheName,
          config: JSON.stringify(data, null, 2),
        }
    );
  }

  public async getSize(
    cacheName: string
  ): Promise<Either<ActionResponse, number>> {
    return this.utils
      .restCall(
        this.endpoint +
          '/caches/' +
          encodeURIComponent(cacheName) +
          '?action=size',
        'GET'
      )
      .then((response) => response.text())
      .then((data) => {
        if (Number.isNaN(data)) {
          return right(Number.parseInt(data)) as Either<ActionResponse, number>;
        } else {
          return left(<ActionResponse>{
            message: 'Size of cache ' + cacheName + ' is not a number :' + data,
            success: false,
          }) as Either<ActionResponse, number>;
        }
      })
      .catch((err) =>
        left(this.utils.mapError(err, 'Cannot get size for cache ' + cacheName))
      );
  }
}
