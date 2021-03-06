export type FormProps = {
  // schema: string
}

export type CustomPriceSelectorProps = {
  formTitle: string
  formFields: FormField[]
  onSuccessfulSubmit: () => void
  children: any
}

export type FormField =
  | InputField
  | SelectField
  | CheckboxField
  | RadioGroupField

export type InputField = {
  name: string
  type?: 'string' | 'number'
  fieldType?: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox'
  label?: string
  defaultValue?: string
  required?: boolean
  format?: string
  showInTitle?: boolean
}

export type SelectField = FormField & {
  options: {
    label: string
    value: string
  }[]
}

export type RadioGroupField = SelectField

export type CheckboxField = RadioGroupField & {
  defaultValues?: string[]
}
