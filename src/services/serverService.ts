import { Either, left, right } from './either';
import { RestUtils } from '@services/restUtils';

/**
 * Infinispan Server related API endpoints
 *
 * @author Katia Aresti
 */
export class ServerService {
  endpoint: string;
  utils: RestUtils;

  constructor(endpoint: string, restUtils: RestUtils) {
    this.endpoint = endpoint;
    this.utils = restUtils;
  }

  /**
   * Get server version or an error
   */
  public async getVersion(): Promise<Either<ActionResponse, string>> {
    return this.utils.get(this.endpoint, (data) => data.version);
  }
}
