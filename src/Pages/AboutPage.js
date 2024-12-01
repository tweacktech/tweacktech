import React, { useState } from 'react';
import {  Globe, Award, Code, Zap, Car, GitFork } from 'lucide-react';
import Footer from '../Component/Footer';
import Navbar from '../Component/Navbar';

const projects = [
  {
    id: 1,
    title: "E-Commerce Platform",
    description: "Full-stack e-commerce application with React, Node.js, and MongoDB",
    technologies: ["React", "Node.js", "MongoDB", "Redux"],
    githubLink: "#",
    liveLink: "#",
    type: "Web Development"
  },
  {
    id: 2,
    title: "AI Chatbot Assistant",
    description: "Machine learning-powered conversational AI with natural language processing",
    technologies: ["Python", "TensorFlow", "Flask", "NLP"],
    githubLink: "#",
    liveLink: "#",
    type: "Machine Learning"
  },
  {
    id: 3,
    title: "Cryptocurrency Tracker",
    description: "Real-time cryptocurrency price tracking and analytics dashboard",
    technologies: ["React", "Chart.js", "Web3.js", "API Integration"],
    githubLink: "#",
    liveLink: "#",
    type: "Web Development"
  },
  {
    id: 4,
    title: "Mobile Health App",
    description: "Cross-platform health and fitness tracking application",
    technologies: ["React Native", "Firebase", "GraphQL"],
    githubLink: "#",
    liveLink: "#",
    type: "Mobile Development"
  }
];

const AboutPage = () => {
  const [filter, setFilter] = useState("All");

  const filteredProjects = filter === "All"
    ? projects
    : projects.filter(project => project.type.includes(filter));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      {/* Header Section */}
      <header className="bg-gradient-to-r from-blue-500 to-red-950 text-white py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <img
            src="/api/placeholder/200/200"
            alt="Profile"
            className="w-48 h-48 rounded-s-md mx-auto mb-2 object-cover border-4 border-white shadow-lg"
          />
          <h1 className="text-4xl font-bold mb-1">Dari Daniel Datongs<br/>(Meyor)</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Full Stack Developer | Machine Learning Enthusiast | Innovation Driver
          </p>
          <div className="flex justify-center space-x-4 mt-6">
            {/* <a href="#" className="hover:text-gray-200">
              <Car size={28} />
            </a>;;;
            <a href="#" className="hover:text-gray-200">
              <Linkedin size={28} />
            </a>
            <a href="#" className="hover:text-gray-200">
              <Globe size={28} />
            </a> */}
          </div>
        </div>
      </header>

      {/* About Me Section */}
      <section className="py-14 max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">About Me</h2>
            <p className="text-gray-600 mb-4">
              I'm a passionate developer with 5+ years of experience in creating innovative
              software solutions. My expertise spans full-stack web development, machine learning,
              and mobile application development.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Award className="mr-3 text-blue-600" />
                <span>Multiple Project Awards</span>
              </div>
              <div className="flex items-center">
                <Code className="mr-3 text-green-600" />
                <span>10+ GitHub Repositories</span>
              </div>
              <div className="flex items-center">
                <Zap className="mr-3 text-yellow-600" />
                <span>Rapid Prototyping Expert</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-md">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {["Laravel","React", "Python", "Mysql","TypeScript"
              //  "Node.js", "Machine Learning", "Docker", "GraphQL",
                , "Java", "AWS"].map((skill) => (
                  <span key={skill} className="bg-blue-100 text-red-950 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="bg-white py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">My Projects</h2>

          {/* Project Filters */}
          <div className="flex justify-center mb-8 space-x-4">
            {["All", "Web Development", "Machine Learning", "Mobile Development"].map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-2 py-2 rounded-full transition ${filter === category
                    ? "bg-red-950 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition"
              >
                <h3 className="text-2xl font-bold mb-3 text-gray-800">{project.title}</h3>
                <p className="text-gray-600 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="bg-blue-100 text-red-950 px-2 py-1 rounded-full text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-4">
                  <a
                    href={project.githubLink}
                    className="flex items-center text-gray-700 hover:text-blue-600"
                  >
                    <GitFork className="mr-2" size={20} /> GitHub
                  </a>
                  <a
                    href={project.liveLink}
                    className="flex items-center text-gray-700 hover:text-blue-600"
                  >
                    <Globe className="mr-2" size={20} /> Live Site
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
    <Footer/>
    </div>
  );
};

export default AboutPage;