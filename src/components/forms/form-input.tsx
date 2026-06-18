import { TextInput } from "react-native";

import type { FormControlProps } from "./form-base";
import { useFieldContext } from "./contexts";
import { FormBase } from "./form-base";

export function FormInput({
  keyboardType,
  autoCapitalize,
  editable,
  placeholder,
  placeholderTextColor,
  ...props
}: FormControlProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <FormBase {...props}>
      <TextInput
        id={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChangeText={(e) => field.handleChange(e)}
        aria-invalid={isInvalid}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        editable={editable}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        className="bg-card text-foreground border-border rounded-lg border px-4 py-3 text-base"
      />
    </FormBase>
  );
}
