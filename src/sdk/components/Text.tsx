import type { InputHTMLAttributes } from "react";
import { usePumiloField } from "../context";

export interface TextProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange"> {
  id: string;
  /**
   * HTML tag used for publish time rendering.
   */
  publishAs?: keyof JSX.IntrinsicElements;
  /**
   * Text to show when a value has not been provided during publish time.
   */
  emptyText?: string;
}

export const TEXT = ({
  id,
  className,
  placeholder = "编辑文本…",
  publishAs = "span",
  emptyText = "",
  ...rest
}: TextProps) => {
  const { mode, value, setValue, readOnly } = usePumiloField(id);

  if (!readOnly && mode === "edit") {
    return (
      <input
        {...rest}
        data-pumilo-field={id}
        className={className}
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
      />
    );
  }

  const Tag = publishAs;

  return (
    <Tag data-pumilo-field={id} className={className}>
      {value || emptyText}
    </Tag>
  );
};

