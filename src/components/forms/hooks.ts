import { createFormHook } from "@tanstack/react-form";

import { FormInput } from "./form-input";
import {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
} from "./contexts";

// import { FormCheckbox } from "./FormCheckbox";
// import { FormInput } from "./FormInput";
// import { FormSelect } from "./FormSelect";
// import { FormTextarea } from "./FormTextarea";

const { useAppForm } = createFormHook({
  fieldComponents: {
    Input: FormInput,
    // Textarea: FormTextarea,
    // Select: FormSelect,
    // Checkbox: FormCheckbox,
  },
  formComponents: {},
  fieldContext,
  formContext,
});

export { useAppForm, useFieldContext, useFormContext };
