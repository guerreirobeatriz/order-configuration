export interface ShowToastParams {
  message: string | JSX.Element
  duration: number
}

export interface ToastRenderProps {
  showToast: (params: ShowToastParams) => void
}
