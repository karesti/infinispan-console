import { KeycloakService } from '@services/keycloakService';
import { AuthenticationService } from '@services/authService';
import { CacheConfigUtils, EncodingType } from '@services/cacheConfigUtils';

export enum ComponentStatus {
  STOPPING = 'STOPPING',
  RUNNING = 'RUNNING',
  OK = 'OK',
  CANCELLING = 'CANCELLING',
  SENDING = 'SENDING',
  ERROR = 'ERROR',
  INSTANTIATED = 'INSTANTIATED',
  INITIALIZING = 'INITIALIZING',
  FAILED = 'FAILED',
  TERMINATED = 'TERMINATED',
}

export enum ComponentHealth {
  HEALTHY = 'HEALTHY',
  HEALTHY_REBALANCING = 'HEALTHY_REBALANCING',
  DEGRADED = 'DEGRADED',
  FAILED = 'FAILED',
}

export enum CacheType {
  Distributed = 'Distributed',
  Replicated = 'Replicated',
  Local = 'Local',
  Invalidated = 'Invalidated',
  Scattered = 'Scattered',
}

export enum ContentType {
  StringContentType = 'String', //'application/x-java-object;type=java.lang.String'
  IntegerContentType = 'Integer', //'application/x-java-object;type=java.lang.Integer'
  DoubleContentType = 'Double', //'application/x-java-object;type=java.lang.Double'
  FloatContentType = 'Float', //'application/x-java-object;type=java.lang.Float'
  LongContentType = 'Long', //'application/x-java-object;type=java.lang.Long'
  BooleanContentType = 'Boolean', //'application/x-java-object;type=java.lang.Boolean'
  JSON = 'Json', //'application/json'
  XML = 'Xml', //'application/xml'
}

export enum Flags {
  CACHE_MODE_LOCAL = 'CACHE_MODE_LOCAL',
  FAIL_SILENTLY = 'FAIL_SILENTLY',
  FORCE_ASYNCHRONOUS = 'FORCE_ASYNCHRONOUS',
  FORCE_SYNCHRONOUS = 'FORCE_SYNCHRONOUS',
  FORCE_WRITE_LOCK = 'FORCE_WRITE_LOCK',
  IGNORE_RETURN_VALUES = 'IGNORE_RETURN_VALUES',
  IGNORE_TRANSACTION = 'IGNORE_TRANSACTION',
  PUT_FOR_EXTERNAL_READ = 'PUT_FOR_EXTERNAL_READ',
  REMOTE_ITERATION = 'REMOTE_ITERATION',
  SKIP_CACHE_LOAD = 'SKIP_CACHE_LOAD',
  SKIP_CACHE_STORE = 'SKIP_CACHE_STORE',
  SKIP_INDEX_CLEANUP = 'SKIP_INDEX_CLEANUP',
  SKIP_INDEXING = 'SKIP_INDEXING',
  SKIP_LISTENER_NOTIFICATION = 'SKIP_LISTENER_NOTIFICATION',
  SKIP_LOCKING = 'SKIP_LOCKING',
  SKIP_OWNERSHIP_CHECK = 'SKIP_OWNERSHIP_CHECK',
  SKIP_REMOTE_LOOKUP = 'SKIP_REMOTE_LOOKUP',
  SKIP_SHARED_CACHE_STORE = 'SKIP_SHARED_CACHE_STORE',
  SKIP_SIZE_OPTIMIZATION = 'SKIP_SIZE_OPTIMIZATION',
  SKIP_STATISTICS = 'SKIP_STATISTICS',
  SKIP_XSITE_BACKUP = 'SKIP_XSITE_BACKUP',
  ZERO_LOCK_ACQUISITION_TIMEOUT = 'ZERO_LOCK_ACQUISITION_TIMEOUT',
}

/**
 * Rest Utility class
 *
 * @author Katia Aresti
 */
export class RestUtils {
  private authenticationService: AuthenticationService;

  public get(url: string, transformer: (json: JSON) => {}, customHeaders?: Headers) : Promise<any> {
    const promise: Promise<Response> =  this.restCall(url, 'GET', customHeaders)
    return promise
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return response.text().then(text => {throw text;});
      }).then(json => {
        return transformer(json);
      });
  }

  public delete(deleteCall: ServiceCall) : Promise<ActionResponse> {
    let responsePromise = this.restCall(deleteCall.url, 'DELETE', deleteCall.customHeaders);
    return this.handleCRUDActionResponse(deleteCall.successMessage, deleteCall.errorMessage, responsePromise);
  }

  public put(putCall: ServiceCall) : Promise<ActionResponse> {
    let responsePromise = this.restCall(putCall.url, 'PUT', putCall.customHeaders, putCall.body);
    return this.handleCRUDActionResponse(putCall.successMessage, putCall.errorMessage, responsePromise);
  }

  public post(postCall: ServiceCall) : Promise<ActionResponse> {
     let responsePromise = this.restCall(postCall.url, 'POST', postCall.customHeaders, postCall.body);
     return this.handleCRUDActionResponse(postCall.successMessage, postCall.errorMessage, responsePromise);
  }

  /**
   * Perform a REST call
   *
   * @param url
   * @param method
   */
  public restCall(
    url: string,
    method: string,
    customHeaders?: Headers,
    body?: string
  ): Promise<Response> {
    let headers = customHeaders;
    if (!headers) {
      headers = this.createAuthenticatedHeader();
      // if (accept && accept.length > 0) {
      //   // headers.append('Accept', '');
      // }
    }
    let fetchOptions: RequestInit = {
      method: method,
      headers: headers,
      credentials: 'include',
    };
    if (body && body.length > 0) {
      fetchOptions['body'] = body;
    }
    return fetch(url, fetchOptions);
  }

  constructor(authenticationService: AuthenticationService) {
    this.authenticationService = authenticationService;
  }

  public createAuthenticatedHeader = (): Headers => {
    let headers = new Headers();
    if (KeycloakService.Instance.isInitialized()) {
      headers.append(
        'Authorization',
        'Bearer ' + localStorage.getItem('react-token')
      );
    }
    return headers;
  };

  /**
   * Handle a crud op request result
   *
   * @param name of the object
   * @param successMessage
   * @param response
   */
  private async handleCRUDActionResponse(
    successMessage: string,
    errorMessage: string,
    response: Promise<Response>
  ): Promise<ActionResponse> {
    return response
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
        if (response.status == 403) {
          throw 'Unauthorized action.';
        }
        return response.text().then(text => {throw text;});
      })
      .then((message) => {
        return <ActionResponse>{
          message: successMessage,
          success: true,
        };
      })
      .catch((err) => this.mapError(err, errorMessage))
  }

  public mapError(err: any, errorMessage: string): ActionResponse {
    console.log(err);
    if (err instanceof TypeError) {
      return <ActionResponse>{
        message: !errorMessage ? err.message : errorMessage,
        success: false,
      };
    }

    if (err instanceof Response) {
      if (err.status == 401) {
        return <ActionResponse>{
          message: errorMessage + '\nUnauthorized action. Check your credentials and try again.',
          success: false,
        };
      }
    }

    return <ActionResponse>{
          message: this.interpret(err as string, errorMessage),
          success: false,
        }
  }

  private interpret(text:string, errorMessage: string) : string {
    if(text.includes('missing type id property \'_type\'')) {
      return 'You are trying to write a JSON key or value that needs \'_type\' field in this cache.';
    }

    if(text.includes('Unknown type id : 5901')) {
      return 'This cache contains Spring Session entries that can not be read or edited from the Console.';
    }

    if(text.includes('Unknown type id')) {
      return 'This cache contains entries that can not be read or edited from the Console.';
    }

    return errorMessage + '\n' + text;
  }

  /**
   * Calculate the key content type header value to send ot the REST API
   * @param contentType
   */
  public static fromContentType(contentType: ContentType): string {
    let stringContentType = '';
    switch (contentType) {
      case ContentType.StringContentType:
      case ContentType.DoubleContentType:
      case ContentType.IntegerContentType:
      case ContentType.LongContentType:
      case ContentType.BooleanContentType:
        stringContentType =
          'application/x-java-object;type=java.lang.' + contentType.toString();
        break;
      case ContentType.JSON:
        stringContentType = 'application/json';
        break;
      case ContentType.XML:
        stringContentType = 'application/xml';
        break;
      default:
        console.warn('Content type not mapped ' + contentType);
    }

    return stringContentType;
  }

  /**
   * Translate from string to ContentType
   *
   * @param contentTypeHeader
   * @param defaultContentType
   */
  public static toContentType(
    contentTypeHeader: string | null | undefined,
    defaultContentType?: ContentType
  ): ContentType {
    if (contentTypeHeader == null) {
      return defaultContentType
        ? defaultContentType
        : ContentType.StringContentType;
    }
    if (
      contentTypeHeader.startsWith('application/x-java-object;type=java.lang.')
    ) {
      const contentType = contentTypeHeader.replace(
        'application/x-java-object;type=java.lang.',
        ''
      );
      return contentType as ContentType;
    }

    if (contentTypeHeader == 'application/json') {
      return ContentType.JSON;
    }

    if (contentTypeHeader == 'application/xml') {
      return ContentType.XML;
    }

    return ContentType.StringContentType;
  }

  /**
   *
   * @param protobufType
   */
  public static fromProtobufType(protobufType: string): ContentType {
    let contentType;

    switch (protobufType) {
      case 'string':
        contentType = ContentType.StringContentType;
        break;
      case 'float':
        contentType = ContentType.FloatContentType;
        break;
      case 'double':
        contentType = ContentType.DoubleContentType;
        break;
      case 'int32':
      case 'uint32':
      case 'sint32':
      case 'fixed32':
      case 'sfixed32':
        contentType = ContentType.IntegerContentType;
        break;
      case 'int64':
      case 'uint64':
      case 'sint64':
      case 'fixed64':
      case 'sfixed64':
        contentType = ContentType.LongContentType;
        break;
      case 'bool':
        contentType = ContentType.BooleanContentType;
        break;
      default:
        contentType = ContentType.StringContentType;
    }
    return contentType;
  }
}
