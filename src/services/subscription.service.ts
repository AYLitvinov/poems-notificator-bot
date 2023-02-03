import {DbService} from "./db.service";
import {CronService} from "./cron.service";
import {VkApiService} from "./vk-api.service";
import {GroupWallItem} from "../models/group.model";
import {SubscriptionEvent} from "../models/subscription.model";
import {Observable, Subject} from "rxjs";

export class SubscriptionService {
    private updateEvent = new Subject<SubscriptionEvent>();

    constructor(private dbService: DbService, private cronService: CronService, private vkApiService: VkApiService) {
        this.initialize();
    }

    getUpdateEvent(): Observable<SubscriptionEvent> {
        return this.updateEvent.asObservable();
    }

    addNewGroup(groupId: number, groupName: string): void {
        this.cronService.setupCron(groupId, () => this.emitSubscriptionEvents(groupId, groupName))
    }

    removeGroup(groupId: number): void {
        this.cronService.stopCron(groupId);
    }

    private initialize(): void {
        this.dbService.getGroups()
            .then(groups => {
                (groups || []).forEach(group => {
                    this.cronService.setupCron(group.id, () => this.emitSubscriptionEvents(group.id, group.name))
                });
            });
    }

    private emitSubscriptionEvents(groupId: number, groupName: string): void {
        console.log(`Проверяю записи для группы с id: ${groupId}`);
        this.getSubscriptionEvent(groupId, groupName)
            .then(event => {
                if (event) {
                    this.updateEvent.next(event);
                }
            })
    }

    private async updateGroupWallItems(groupId: number): Promise<GroupWallItem[] | null> {
        const groupWallItems = await this.vkApiService.getWallItemsById(`${groupId}`);
        const newWallItems: GroupWallItem[] = (groupWallItems?.items || [])
            .map(responseWallItem => ({id: responseWallItem.id, text: responseWallItem.text}));

        const oldWallItems = (await this.dbService.getGroupById(groupId))?.wallItems || [];

        if (!oldWallItems.length) {
            const isWallItemsUpdated = await this.dbService.updateGroupWallItems(groupId, newWallItems);

            if (isWallItemsUpdated) {
                console.log(`Обновлены записи группы с id: ${groupId}`);
            }
            return null;
        }

        const wallItemsToUser = newWallItems
            .filter(newWallItem => !oldWallItems.find(item => newWallItem.id === item.id));

        if (wallItemsToUser.length) {
            const isWallItemsUpdated = await this.dbService.updateGroupWallItems(groupId, newWallItems);

            if (isWallItemsUpdated) {
                console.log(`Обновлены записи группы с id: ${groupId}`);
            }
            return wallItemsToUser;
        }
        return null;
    }

    private async getSubscriptionEvent(groupId: number, groupName: string): Promise<SubscriptionEvent | null> {
        const newWallItems = await this.updateGroupWallItems(groupId);
        if (newWallItems) {
            const chats = await this.dbService.getChats();
            const chatIdsToUpdate = chats.reduce<number[]>((result, chat) => {
                if (chat.groupIds.includes(groupId)) {
                    result.push(chat.chatId);
                }
                return result;
            }, []);
            return {chatIds: chatIdsToUpdate, groupId, groupName, wallItems: newWallItems};
        }
        return null;
    }
}
