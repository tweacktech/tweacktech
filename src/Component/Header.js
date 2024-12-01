import React from 'react'
import logo from './tweacktech.jpg'

function Header() {
  return (
    <div>
       <header className="pt-24 pb-12 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Transform Your Business 
              <span className="block text-red-950">With Smart Solutions</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Unlock unprecedented growth and efficiency with our cutting-edge platform designed for modern enterprises.
            </p>
            <div className="flex space-x-4">
              <button className="bg-red-950 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                Start Free SpeedTypingTest
              </button>
              <button className="bg-white text-red-950 px-6 py-3 rounded-lg border border-red-950 hover:bg-blue-50 transition">
                Learn More
              </button>
            </div>
          </div>
          
          {/* Placeholder Hero Image */}
          <div className="hidden md:flex justify-center">
            <div className="w-full max-w-md bg-blue-100 rounded-xl aspect-square flex items-center justify-center">
              <span className="text-red-950 text-2xl ">
                <img src={require('./tweacktech.jpg')} alt='Hero  Placeholder'/>
                </span>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}

export default Header