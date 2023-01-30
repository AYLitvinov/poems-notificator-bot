import { VkApiGroupWallItem } from './vk.model';

export interface Group {
    readonly id: number;
    readonly name: string;
    readonly domainName: string;
    readonly wallItems: GroupWallItem[];
}

export type GroupWallItem = VkApiGroupWallItem;
