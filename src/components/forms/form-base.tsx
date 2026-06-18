import type { ReactNode } from "react";
import { Text } from "react-native";

import { useFieldContext } from "./contexts";

export interface FormControlProps {
  label: string;
  description?: string;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  placeholderTextColor?: string;
}

type FormBaseProps = FormControlProps & {
  children: ReactNode;
  horizontal?: boolean;
  controlFirst?: boolean;
};

export function FormBase({
  children,
  label,
  description,
  controlFirst,
}: FormBaseProps) {
  const field = useFieldContext();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const labelElement = (
    <>
      <Text className="text-foreground mb-2 text-sm font-medium">{label}</Text>
      {description && <Text>{description}</Text>}
    </>
  );

  const errorElem = isInvalid && (
    <Text className="text-destructive mt-2 text-sm">
      {field.state.meta.errors
        .map((x: { code: string; message?: string }) => x.message)
        .join(", ")}
    </Text>
  );

  return (
    <>
      {controlFirst ? (
        <>
          {children}
          <>
            {labelElement}
            {errorElem}
          </>
        </>
      ) : (
        <>
          <>{labelElement}</>
          {children}
          {errorElem}
        </>
      )}
    </>
  );
}
