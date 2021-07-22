import { KeycloakService } from '@services/keycloakService';
import { AuthenticationService } from '@services/authService';
import { Either, right, left } from '@services/either';

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


/**
 * Rest Utility class
 *
 * @author Katia Aresti
 */
export class RestUtils {
  private authenticationService: AuthenticationService;

  /**
   * Get REST API Calls
   *
   * @param url
   * @param transformer
   * @param customHeaders
   */
  public get(
    url: string,
    transformer: (data: any) => {},
    customHeaders?: Headers,
    text?: boolean
  ): Promise<Either<any, any>> {
    const promise: Promise<Response> = this.restCall(url, 'GET', customHeaders);
    return promise
      .then((response) => {
        if (response.ok) {
          return text ? response.text() : response.json();
        }
        return response.text().then((text) => {
          throw text;
        });
      })
      .then((data) => {
        return right(transformer(data));
      })
      .catch((err) =>
        left(this.mapError(err, 'Unexpected error retrieving data.'))
      );
  }

  /**
   * Delete REST API Calls
   *
   * @param deleteCall
   */
  public delete(deleteCall: ServiceCall): Promise<ActionResponse> {
    let responsePromise = this.restCall(
      deleteCall.url,
      'DELETE',
      deleteCall.customHeaders
    );
    return this.handleCRUDActionResponse(
      deleteCall.successMessage,
      deleteCall.errorMessage,
      responsePromise
    );
  }

  /**
   * Put REST API calls
   *
   * @param putCall
   */
  public put(putCall: ServiceCall): Promise<ActionResponse> {
    let responsePromise = this.restCall(
      putCall.url,
      'PUT',
      putCall.customHeaders,
      putCall.body
    );
    return this.handleCRUDActionResponse(
      putCall.successMessage,
      putCall.errorMessage,
      responsePromise
    );
  }

  /**
   * Post REST API calls
   *
   * @param postCall
   */
  public post(postCall: ServiceCall): Promise<ActionResponse> {
    let responsePromise = this.restCall(
      postCall.url,
      'POST',
      postCall.customHeaders,
      postCall.body
    );
    return this.handleCRUDActionResponse(
      postCall.successMessage,
      postCall.errorMessage,
      responsePromise
    );
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
          return 'response.text()';
        }
        if (response.status == 404) {
          throw 'Not found.';
        }
        if (response.status == 403) {
          throw 'Unauthorized action.';
        }
        return response.text().then((text) => {
          throw text;
        });
      })
      .then((message) => {
        return <ActionResponse>{
          message: successMessage,
          success: true,
        };
      })
      .catch((err) => this.mapError(err, errorMessage));
  }

  public mapError(err: any, errorMessage: string): ActionResponse {
    if (err instanceof TypeError) {
      return <ActionResponse>{
        message: !errorMessage ? err.message : errorMessage,
        success: false,
      };
    }

    if (err instanceof Response) {
      if (err.status == 401) {
        return <ActionResponse>{
          message:
            errorMessage +
            '\nUnauthorized action. Check your credentials and try again.',
          success: false,
        };
      }
    }

    return <ActionResponse>{
      message: this.interpret(err as string, errorMessage),
      success: false,
    };
  }

  private interpret(text: string, errorMessage: string): string {
    if (text.includes("missing type id property '_type'")) {
      return "You are trying to write a JSON key or value that needs '_type' field in this cache.";
    }

    if (text.includes('Unknown type id : 5901')) {
      return 'This cache contains Spring Session entries that can not be read or edited from the Console.';
    }

    if (text.includes('Unknown type id')) {
      return 'This cache contains entries that can not be read or edited from the Console.';
    }

    return errorMessage + '\n' + text;
  }
}
