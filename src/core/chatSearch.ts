import type { Msg } from './types';
import { cleanReply } from './emotion';

/** Search visible conversation text, excluding hidden tags and diagnostic attempts. */
export function searchChat(messages: Msg[], query: string, charName: string): string[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  return messages.filter(message => {
    const visible = message.role === 'user' ? message.content+(message.imageReport?`\n${message.imageReport.filename}\n${message.imageReport.description}`:'') : cleanReply(message.content, charName).text;
    return visible.toLocaleLowerCase().includes(needle);
  }).map(message => message.id);
}
