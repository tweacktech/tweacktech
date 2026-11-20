import React from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Code2,
  GraduationCap,
  Heart,
  Rocket,
  Target,
  Users,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';

const values = [
  {
    icon: BookOpen,
    title: 'Learn by doing',
    body: 'Every course pairs short lessons with practical assignments so skills stick.',
  },
  {
    icon: Target,
    title: 'Career focused',
    body: 'Curriculum is shaped around the skills employers actually hire for.',
  },
  {
    icon: Users,
    title: 'Community first',
    body: 'Instructors and mentors support learners through feedback and live sessions.',
  },
  {
    icon: Heart,
    title: 'Accessible to all',
    body: 'Free and partially funded courses keep quality tech education within reach.',
  },
];

const stats = [
  { value: '8+', label: 'Expert-led courses' },
  { value: '4', label: 'Career tracks' },
  { value: '100%', label: 'Project based' },
  { value: '24/7', label: 'Learning access' },
];

const AboutPage = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
    <Navbar />

    <header className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="container-page py-14">
        <div className="max-w-3xl">
          <span className="section-eyebrow">
            <Rocket className="h-3.5 w-3.5" /> About TweackTech
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            A learning platform and a <span className="gradient-text">talent hub</span> in one.
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            TweackTech helps people learn modern technology skills, prove what they can do,
            and connect directly with companies hiring developers and designers.
          </p>
        </div>
      </div>
    </header>

    <main className="container-page py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-6 text-center">
            <p className="text-3xl font-extrabold text-red-600 dark:text-red-500">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="section-eyebrow">Our story</span>
          <h2 className="section-title mt-4">Built for learners who want real outcomes</h2>
          <p className="section-subtitle">
            Too many courses stop at theory. TweackTech was built around a simple idea: a
            learner should leave every module with something they can show an employer — a
            project, a certificate, or a job application.
          </p>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Our learning management system tracks progress, assignments, attendance, and
            certificates. Our talent hub gives graduates a profile where hiring teams can
            discover them, and lets approved partners post roles directly to the community.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/courses" className="btn-primary">
              <GraduationCap className="h-4 w-4" /> Explore courses
            </Link>
            <Link to="/jobs" className="btn-secondary">
              <Briefcase className="h-4 w-4" /> View jobs
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 card p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <span className="section-eyebrow">
              <Award className="h-3.5 w-3.5" /> What we offer
            </span>
            <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              Courses, assignments, certificates, and hiring
            </h2>
            <ul className="mt-4 space-y-2.5">
              {[
                'Structured courses with slides, documents, PDFs, and video lessons',
                'Assignments with instructor feedback and grading',
                'Downloadable certificates on completion',
                'A public talent hub and vetted job board',
                'Live sessions and attendance tracking',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Code2 className="h-4 w-4 text-red-600 dark:text-red-400" /> For learners
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Start free, track your progress, and build a portfolio as you learn.
              </p>
              <Link to="/register" className="btn-primary mt-3 w-full">
                Create free account
              </Link>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Briefcase className="h-4 w-4 text-red-600 dark:text-red-400" /> For companies
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Discover vetted developers and post roles to the community.
              </p>
              <Link to="/contact" className="btn-secondary mt-3 w-full">
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14 rounded-2xl border border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-slate-900 p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Ready to start learning?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
          Join thousands of learners building practical tech skills and connecting with
          employers on TweackTech.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/courses" className="btn-primary">Browse courses</Link>
          <Link to="/register" className="btn-secondary">Join free</Link>
        </div>
      </section>
    </main>

    <Footer />
  </div>
);

export default AboutPage;
