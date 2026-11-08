/** Joel's WhatsApp number (same as the legacy site). */
export const WHATSAPP_NUMBER = '50660062513';

/** One line of the message: a label and its value; lines without a value are left out. */
export type MessageLine = readonly [label: string, value: string | null | undefined];

/**
 * The WhatsApp message shared by every product:
 *   <intro>
 *   - <label>: <value>
 * in order, leaving out the lines without a value.
 */
export function composeMessage(intro: string, lines: readonly MessageLine[]): string {
  return [
    intro,
    ...lines.filter(([, value]) => value).map(([label, value]) => `- ${label}: ${value ?? ''}`),
  ].join('\n');
}

export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
