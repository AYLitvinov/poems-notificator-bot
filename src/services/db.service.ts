import { Collection, Db, MongoClient } from 'mongodb';
import { Chat } from '../models/chat.model';
import { Group, GroupWallItem } from '../models/group.model';

const POEMS_NOTIFICATOR_DATABASE_NAME = 'poems-notificator';

const CHATS_COLLECTION_NAME = 'chats';
const GROUPS_COLLECTION_NAME = 'groups';

const MONGO_DB_URL = `mongodb://db:27017/`;

export class DbService {
    private mongoDbClient: Promise<MongoClient> = new MongoClient(MONGO_DB_URL).connect();

    async getDb(): Promise<Db> {
        const client = await this.mongoDbClient;
        return client.db(POEMS_NOTIFICATOR_DATABASE_NAME);
    }

    async getChatsCollection(): Promise<Collection<Chat>> {
        const db = await this.getDb();
        return db.collection(CHATS_COLLECTION_NAME)
    }

    async getGroupsCollection(): Promise<Collection<Group>> {
        const db = await this.getDb();
        return db.collection(GROUPS_COLLECTION_NAME)
    }

    async getChats(): Promise<Chat[]> {
        const chats = await this.getChatsCollection();
        return chats.find({}).toArray();
    }

    async getChatById(chatId: number): Promise<Chat | null> {
        const chats = await this.getChatsCollection();
        return chats.findOne({chatId});
    }

    async addNewChat(chatId: number, groupIds: number[]): Promise<boolean> {
        const chats = await this.getChatsCollection();
        return !!await chats.insertOne({chatId, groupIds});
    }

    async updateChat(chatId: number, groupIds: number[]): Promise<boolean> {
        const chats = await this.getChatsCollection();
        return !!await chats.updateOne({chatId}, {$set: {chatId, groupIds}});
    }

    async addNewGroup(group: Group): Promise<boolean> {
        const groups = await this.getGroupsCollection();
        return !!await groups.insertOne(group);
    }

    async updateGroupWallItems(groupId: number, wallItems: GroupWallItem[]): Promise<boolean> {
        const groups = await this.getGroupsCollection();
        return !!await groups.updateOne({id: groupId}, {$set: {wallItems}});
    }

    async getGroupById(groupId: number): Promise<Group | null> {
        const groups = await this.getGroupsCollection();
        return groups.findOne({id: groupId});
    }

    async getGroups(): Promise<Group[] | null> {
        const groups = await this.getGroupsCollection();
        return groups.find({}).toArray();
    }

    async getGroupsByChatId(chatId: number): Promise<Group[] | null> {
        const groups = await this.getGroups();
        const groupIds = (await this.getChatById(chatId))?.groupIds || [];
        return (groups || []).filter(group => groupIds.includes(group.id));
    }

    async removeGroup(groupId: number): Promise<boolean> {
        const groups = await this.getGroupsCollection();
        return !! await groups.deleteOne({id: groupId});
    }
}
