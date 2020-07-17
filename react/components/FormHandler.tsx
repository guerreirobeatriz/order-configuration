import React, { FC, useMemo, useState, useCallback } from 'react'
import {
  FormContext,
  JSONSchemaType,
  JSONSubSchemaInfo,
  getDataFromPointer,
  OnSubmitParameters,
} from 'react-hook-form-jsonschema'
import { useMutation } from 'react-apollo'
import { ExtensionPoint } from 'vtex.render-runtime'
import { GraphQLError } from 'graphql'

import updateCustomSessionKeys from '../mutations/updateCustomSessionKeys.graphql'
import { FormProps } from '../typings/FormProps'
import { parseMasterDataError } from '../logic/masterDataError'
import { useSubmitReducer, SubmitContext } from '../logic/formState'

export const FormHandler: FC<{
  schema: JSONSchemaType
  formProps: FormProps
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

      console.log(JSON.stringify(data))

      await updateCustomSessionKeyMutation({
        variables: {
          sessionData: { sessionData: JSON.stringify(data) },
        },
      })
        .then((r) => {
          console.log(r)
          dispatchSubmitAction({ type: 'SET_SUCCESS' })
        })
        .catch(e => {
          setLastErrorFieldValues(data)
          console.log(e)

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

  if (submitState.success) {
    return <ExtensionPoint id="form-success" />
  }

  console.log(props)

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
        {props.children}
      </SubmitContext.Provider>
    </FormContext>
  )
}
