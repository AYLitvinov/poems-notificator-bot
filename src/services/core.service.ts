import { DbService } from './db.service';
import { VkApiService } from './vk-api.service';

export class CoreService {
    private dbService = new DbService();
    private vkApiService = new VkApiService();

    onText(): void {

    }
}
