import type { NextPage } from 'next'

import LoginForm from './login-form'

const Login: NextPage = () => {
  console.info('Login page')
  return (
    <LoginForm />
  )
}

export default Login
