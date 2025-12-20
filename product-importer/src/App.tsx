import './App.css'
import { Products, EditProduct } from './components';
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/edit" element={<EditProduct/>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
