import React from 'react'
import Navbar from '../Component/Navbar'
import Header from '../Component/Header'
import Footer from '../Component/Footer'
import { BookOpen, EraserIcon, Smile } from 'lucide-react'
import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div>
      {/* Navigation */}
      <Navbar />

      {/* Header Section
      <Header /> */}

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Page not found 
            </h2>
           
          </div>

          <div className="grid md:grid-cols-1 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition">
              <Smile className="mx-auto mb-6 text-blue-600" size={56} />
              <h3 className="text-2xl font-bold mb-4 text-gray-900">404  Page not found. Please check the URL and try again.</h3>
            
              <Link to='/'  className="w-full bg-red-950 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Home</Link>
            </div>
          </div>

        </div>
      </section>



      {/* Footer */}
      <Footer />

    </div>
  )
}

export default NotFound
