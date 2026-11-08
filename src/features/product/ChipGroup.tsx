import type { ReactNode } from 'react';

import type { Choice } from '../../data/forms';
import { useI18n } from '../../i18n';

interface ChipGroupProps<Id extends string> {
  legend: string;
  /** Radio group name, unique within the dialog. */
  name: string;
  options: readonly (Choice & { id: Id })[];
  value: Id | null;
  onChange: (id: Id) => void;
  /** Extra fields shown under the chips (the "Other" text, the measurement). */
  children?: ReactNode;
}

/**
 * One configurator question: a fieldset of radio chips. The radios stay in the
 * accessibility tree and the keyboard order (arrow keys move within the group);
 * each chip is its radio's label.
 */
export function ChipGroup<Id extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  children,
}: ChipGroupProps<Id>) {
  const { lang } = useI18n();
  return (
    <fieldset className="configurator-group">
      <legend className="configurator-legend">{legend}</legend>
      <div className="chips">
        {options.map((option) => (
          <label key={option.id} className="chip">
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => {
                onChange(option.id);
              }}
            />
            <span>{option.label[lang]}</span>
          </label>
        ))}
      </div>
      {children}
    </fieldset>
  );
}
