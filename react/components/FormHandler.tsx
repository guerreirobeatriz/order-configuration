import React, { FC, useMemo, useState, useCallback } from 'react'
import {
  FormContext,
  JSONSchemaType,
  JSONSubSchemaInfo,
  getDataFromPointer,
  OnSubmitParameters,
} from 'react-hook-form-jsonschema'
import { useMutation } from 'react-apollo'
import { GraphQLError } from 'graphql'

import updateCustomSessionKeys from '../mutations/updateCustomSessionKeys.graphql'
import { FormProps } from '../typings/FormProps'
import { parseMasterDataError } from '../logic/masterDataError'
import { useSubmitReducer, SubmitContext } from '../logic/formState'
import { useCssHandles } from 'vtex.css-handles'

const CSS_HANDLES = ['orderConfigFormWrapper'] as const

export const FormHandler: FC<{
  schema: JSONSchemaType
  formProps: FormProps
  email: string | null
  onSuccessfulSubmit: () => void
}> = props => {
  const [updateCustomSessionKeyMutation, { error }] = useMutation(updateCustomSessionKeys)

  const masterDataErrors = useMemo(() => parseMasterDataError(error), [error])
  const [lastErrorFieldValues, setLastErrorFieldValues] = useState<
    Record<string, string>
  >({})

  const [submitState, dispatchSubmitAction] = useSubmitReducer()

  const onSubmit = useCallback(
    async ({ data, methods, event }: OnSubmitParameters) => {
      if (event) {
        event.preventDefault()
      }
      dispatchSubmitAction({ type: 'SET_LOADING' })

      const sessionData = { ...data, email: props.email }

      await updateCustomSessionKeyMutation({
        variables: {
          sessionData: { sessionData: sessionData },
        },
      })
        .then(() => {
          dispatchSubmitAction({ type: 'SET_SUCCESS' })
          const { onSuccessfulSubmit } = props
          onSuccessfulSubmit()
        })
        .catch(e => {
          setLastErrorFieldValues(data)

          if (e.graphQLErrors) {
            for (const graphqlError of e.graphQLErrors as GraphQLError[]) {
              if (
                graphqlError.extensions?.exception?.name === 'UserInputError'
              ) {
                dispatchSubmitAction({ type: 'SET_USER_INPUT_ERROR' })
              } else {
                dispatchSubmitAction({
                  type: 'SET_SERVER_INTERNAL_ERROR',
                })
              }
            }
          } else {
            dispatchSubmitAction({ type: 'SET_SERVER_INTERNAL_ERROR' })
          }

          methods.triggerValidation()
        })
    },
    [
      updateCustomSessionKeyMutation,
      dispatchSubmitAction,
    ]
  )

  const handles = useCssHandles(CSS_HANDLES)

  return (
    <FormContext
      schema={props.schema}
      onSubmit={onSubmit}
      customValidators={{
        graphqlError: (value, context: JSONSubSchemaInfo) => {
          const lastValue = getDataFromPointer(
            context.pointer,
            lastErrorFieldValues
          )
          if (
            masterDataErrors[context.pointer] &&
            ((!lastValue && !value) || lastValue === value)
          ) {
            return masterDataErrors[context.pointer][0]
          }
          return true
        },
      }}
    >
      <SubmitContext.Provider value={submitState}>
        <div className={handles.orderConfigFormWrapper}>
          {props.children}
        </div>
      </SubmitContext.Provider>
    </FormContext>
  )
}