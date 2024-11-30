import React from 'react'
import { Link } from 'react-router-dom'

function Footer() {
  return (
    <div>
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-xl font-bold mb-4"><Link to="/">TweackTech</Link></h4>
            <p className="text-gray-400">
              Innovative solutions for modern businesses, powered by cutting-edge technology.
            </p>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-4">Quick Links</h4>
            <div className="space-y-2">
              {/* <Link to="#" className="text-gray-400 hover:text-white">Features</Link> */}
              {/* <Link to="#" className="block text-gray-400 hover:text-white">Pricing</Link> */}
              <Link to="/about" className="block text-gray-400 hover:text-white">About</Link>
              <Link to="/contact" className="block text-gray-400 hover:text-white">Contact</Link>
              <Link to="#" className="block text-gray-400 hover:text-white">Support</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold mb-4">Contact</h4>
            <p className="text-gray-400">
              Email: meyorpop@gmail.com
              <br />
              Phone: (+234) 7065216112
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-6 text-center">
          <p className="text-gray-500">
            © 2024 TweackTech. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Footer
