
import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../src/Firebase/AuthContext.tsx'
import { NotificationProvider } from './Context/NotificationContext.tsx'; 

import Orders from '../src/Pages/Orders.tsx'
import Profile from '../src/Pages/Profile.tsx'
import Products from '../src/Pages/Products.tsx'
import Resipes from './Pages/Resipes.tsx'
import  AuthPage from "./Pages/AuthPage.tsx";
import { BottomTabs } from '../src/Components/BottomTabs.tsx' 
import './App.css'

function App() {
  return (
    

  <NotificationProvider>
     
   
    <AuthProvider>
      <main className="app-content">
        <Routes>
          <Route path='/' element={<Orders />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/products' element={<Products />} />
          <Route path='/recipes' element={<Resipes />} />
          <Route path='/auth' element={<AuthPage />} />

        </Routes>
      </main>
      <BottomTabs />
      </AuthProvider>

   </NotificationProvider>
    
  )
}

export default App