import React from 'react';
import { 
  Code, 
  Smartphone, 
  Globe, 
  Target, 
  Users, 
  Award, 
  BookOpen, 
  Rocket 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';

const TeamMember = ({ name, role, image }) => (
  <div className="bg-white rounded-lg shadow-md p-6 text-center">
    <img 
      src={`/api/placeholder/200/200?text=${name.replace(' ', '+')}`} 
      alt={name} 
      className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
    />
    <h3 className="font-semibold text-lg">{name}</h3>
    <p className="text-gray-600">{role}</p>
  </div>
);

const AboutPage = () => {
  const services = [
    {
      icon: <Code className="w-12 h-12 text-blue-600" />,
      title: 'Web Development',
      description: 'Crafting responsive, high-performance websites and web applications using cutting-edge technologies.'
    },
    {
      icon: <Smartphone className="w-12 h-12 text-green-600" />,
      title: 'Mobile App Development',
      description: 'Creating intuitive and powerful mobile applications for iOS and Android platforms.'
    },
    {
      icon: <BookOpen className="w-12 h-12 text-purple-600" />,
      title: 'Tech Training',
      description: 'Providing comprehensive training programs to help individuals and teams master modern technologies.'
    }
  ];

  const teamMembers = [
    { name: 'Dari Daniel (Meyor)', role: 'Founder & CEO' },
    { name: 'Sarah Chen', role: 'Chief Technology Officer' },
    { name: 'Michael Thompson', role: 'Lead Web Developer' },
    { name: 'Emma Johnson', role: 'Mobile App Specialist' }
  ];

  return (
    <>
    <Navbar/>
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="bg-red-950 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center">
            <Rocket className="mr-4" /> TweakTech
          </h1>
          <p className="text-xl max-w-2xl mx-auto">
            Transforming innovative ideas into powerful digital solutions that drive business growth and technological advancement.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 flex items-center">
              <Target className="mr-4 text-blue-600" /> Our Mission
            </h2>
            <p className="text-gray-700 mb-4">
              At TweakTech, we believe in empowering businesses and individuals through innovative technology solutions. Our mission is to bridge the gap between complex technological challenges and user-friendly, efficient digital experiences.
            </p>
            <p className="text-gray-700">
              We don't just create software; we craft digital ecosystems that transform how businesses operate and how people interact with technology.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white shadow-md rounded-lg p-6 text-center">
              <Award className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <h3 className="font-semibold">3+ Years</h3>
              <p className="text-gray-600">Industry Experience</p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6 text-center">
              <Users className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <h3 className="font-semibold">10+</h3>
              <p className="text-gray-600">Successful Projects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="bg-gray-50 rounded-lg p-6 text-center shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center mb-6">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
          <Link to="/meyor">  <TeamMember 
              key={index} 
              name={member.name} 
              role={member.role} 
            /></Link>
          ))}
        </div>
      </div>
    
    </div>
    <Footer/>
    </>
    
  );
};

export default AboutPage;