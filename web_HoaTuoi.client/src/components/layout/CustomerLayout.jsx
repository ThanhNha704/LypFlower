// src/components/layout/CustomerLayout.jsx
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import Chatbox from './Chatbox';

export default function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Chatbox />
    </div>
  );
}
