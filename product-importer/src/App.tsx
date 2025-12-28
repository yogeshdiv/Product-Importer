import './App.css'
import { Products, EditProduct, Files } from './components';
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Products />} />
        <Route path="/edit" element={<EditProduct/>} />
        <Route path="/files" element={<Files />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
