import styled from 'styled-components'

export interface ButtonProps {
  onClick?: () => void
  children?: JSX.Element
}

const ButtonDiv = styled.div`
  border-radius: 8px;
  padding: 2px 8px;
  height: 40px;
  line-height: 40px;
  cursor: pointer;
  width: fit-content;
  background-color: #2fb3ff;
`

export function Button(props: ButtonProps) {
  return <ButtonDiv onClick={props.onClick}>
    {props.children}
  </ButtonDiv>
}

Button.displayName = 'Button'