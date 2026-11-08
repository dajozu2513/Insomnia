import { useI18n } from '../../i18n';
import { whatsappUrl } from './whatsapp';

/** The dialogs' call to action: the legacy underlined link with an arrow, to WhatsApp. */
export function WhatsAppButton({ message }: { message: string }) {
  const { t } = useI18n();
  return (
    <a
      className="product-dialog-cta"
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t.home.product.cta}
      <span className="visually-hidden"> {t.home.product.newTab}</span>
    </a>
  );
}
