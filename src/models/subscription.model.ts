import {GroupWallItem} from "./group.model";

export interface SubscriptionEvent {
    readonly chatIds: number[];
    readonly groupId: number;
    readonly groupName: string;
    readonly wallItems: GroupWallItem[];
}
