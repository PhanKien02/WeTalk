import type { Message, MessageGroup } from "@/type";

export type { MessageGroup };

export function groupMessages(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];

  for (const message of messages) {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.senderId === message.senderId) {
      lastGroup.messages.push(message);
    } else {
      groups.push({
        senderId: message.senderId,
        isOwn: message.isOwn,
        messages: [message],
      });
    }
  }

  return groups;
}
