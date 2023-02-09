import React from 'react'
import ReactDOM from 'react-dom'
import App, {Claim} from './App'

ReactDOM.render(<App />, document.getElementById('connect-wallet'))

ReactDOM.render(<Claim />, document.getElementById('claim'))