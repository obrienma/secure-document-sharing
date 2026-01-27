import { LinksService } from '../links/links.service';

export class ShareService {
  static async verifyLinkAccess(token: string, password?: string) {
    return await LinksService.verifyLinkAccess(token, password);
  }
}
