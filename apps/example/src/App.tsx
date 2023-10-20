import { Button } from '@42arch/ui'
import { add } from '@42arch/helper'
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(1)
  const onAdd = (count: number) => {
    return add(count, 4)
  }

  return (
    <>
      <h1>Count: {count}</h1>
      <div className="card">
        <Button onClick={() => {
          const currentCount = onAdd(count)
          setCount(currentCount)
        }}>Increment</Button>
      </div>
    </>
  )
}

export default App
