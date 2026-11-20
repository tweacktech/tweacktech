import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import * as bcrypt from 'bcryptjs';
import {
  Role,
  CourseType,
  TicketStatus,
  TicketPriority,
  LessonType,
  JobType,
  AssignmentStatus,
} from '@prisma/client';

@Injectable()
export class SeedersService {
  private readonly logger = new Logger(SeedersService.name);

  constructor(private prisma: PrismaService) {}

  async seed() {
    this.logger.log('🌱 Starting comprehensive database seeding...');

    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('password@123', saltRounds);

    // ========================================================================
    // 1. USERS
    // ========================================================================
    this.logger.log('👥 Creating users...');

    const superAdmin = await this.prisma.user.upsert({
      where: { email: 'meyorpop@gmail.com' },
      update: {
        role: Role.SUPERADMIN,
        isActive: true,
        permissions: [
          'MANAGE_COURSES', 'MANAGE_STUDENTS', 'MANAGE_BLOG', 'MANAGE_JOBS',
          'MANAGE_SUPPORT', 'GRADE_ASSIGNMENTS', 'MANAGE_USERS', 'MANAGE_PAYMENTS',
          'MANAGE_TALENT', 'MANAGE_CHAT', 'MANAGE_CERTIFICATES', 'MANAGE_SETTINGS',
        ],
      },
      create: {
        email: 'meyorpop@gmail.com',
        password: defaultPassword,
        firstName: 'Meyor',
        lastName: 'Pop',
        role: Role.SUPERADMIN,
        permissions: [
          'MANAGE_COURSES',
          'MANAGE_STUDENTS',
          'MANAGE_BLOG',
          'MANAGE_JOBS',
          'MANAGE_SUPPORT',
          'GRADE_ASSIGNMENTS',
          'MANAGE_USERS',
          'MANAGE_PAYMENTS',
          'MANAGE_TALENT',
          'MANAGE_CHAT',
          'MANAGE_CERTIFICATES',
          'MANAGE_SETTINGS',
        ],
        isActive: true,
        emailVerified: true,
        bio: 'Super Administrator & Founder of TweackTech LMS',
        location: 'Lagos, Nigeria',
        website: 'https://tweacktech.com',
        github: 'meyorpop',
        linkedin: 'meyorpop',
        twitter: 'meyorpop',
      },
    });

    const adminPermissions = [
      'MANAGE_COURSES',
      'MANAGE_BLOG',
      'MANAGE_JOBS',
      'MANAGE_SUPPORT',
      'MANAGE_PAYMENTS',
      'MANAGE_TALENT',
      'MANAGE_CHAT',
      'MANAGE_CERTIFICATES',
      'MANAGE_USERS',
      'MANAGE_SETTINGS',
    ];
    const admin = await this.prisma.user.upsert({
      where: { email: 'admin@tweacktech.com' },
      update: { role: Role.ADMIN, permissions: adminPermissions, isActive: true },
      create: {
        email: 'admin@tweacktech.com',
        password: defaultPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
        permissions: adminPermissions,
        isActive: true,
        emailVerified: true,
        bio: 'Platform Administrator',
        location: 'Abuja, Nigeria',
      },
    });

    const staff1 = await this.prisma.user.upsert({
      where: { email: 'staff@tweacktech.com' },
      update: {},
      create: {
        email: 'staff@tweacktech.com',
        password: defaultPassword,
        firstName: 'John',
        lastName: 'Instructor',
        role: Role.STAFF,
        permissions: ['MANAGE_COURSES', 'MANAGE_BLOG', 'MANAGE_JOBS', 'GRADE_ASSIGNMENTS'],
        isActive: true,
        emailVerified: true,
        bio: 'Senior Full-Stack Developer & Instructor',
        location: 'San Francisco, CA',
        hourlyRate: 80,
        availability: 'Available',
        website: 'https://johndeveloper.com',
        github: 'johndeveloper',
        linkedin: 'johndeveloper',
      },
    });

    const staff2 = await this.prisma.user.upsert({
      where: { email: 'instructor@tweacktech.com' },
      update: {},
      create: {
        email: 'instructor@tweacktech.com',
        password: defaultPassword,
        firstName: 'Sarah',
        lastName: 'Developer',
        role: Role.STAFF,
        permissions: ['MANAGE_COURSES', 'GRADE_ASSIGNMENTS'],
        isActive: true,
        emailVerified: true,
        bio: 'React & TypeScript Expert',
        location: 'New York, NY',
        hourlyRate: 90,
        availability: 'Available',
        github: 'sarahdev',
        linkedin: 'sarahdev',
      },
    });

    const student1 = await this.prisma.user.upsert({
      where: { email: 'student@tweacktech.com' },
      update: {},
      create: {
        email: 'student@tweacktech.com',
        password: defaultPassword,
        firstName: 'Alice',
        lastName: 'Learner',
        role: Role.STUDENT,
        isActive: true,
        emailVerified: true,
        location: 'London, UK',
        bio: 'Frontend enthusiast learning React and TypeScript.',
      },
    });

    const student2 = await this.prisma.user.upsert({
      where: { email: 'dev@tweacktech.com' },
      update: {},
      create: {
        email: 'dev@tweacktech.com',
        password: defaultPassword,
        firstName: 'Bob',
        lastName: 'Coder',
        role: Role.STUDENT,
        isActive: true,
        emailVerified: true,
        location: 'Berlin, Germany',
        bio: 'Backend developer exploring data science.',
      },
    });

    const student3 = await this.prisma.user.upsert({
      where: { email: 'learner@tweacktech.com' },
      update: {},
      create: {
        email: 'learner@tweacktech.com',
        password: defaultPassword,
        firstName: 'Chidi',
        lastName: 'Okoro',
        role: Role.STUDENT,
        isActive: true,
        emailVerified: true,
        location: 'Nairobi, Kenya',
      },
    });

    this.logger.log('✅ Created 7 users');

    // ========================================================================
    // 2. CATEGORIES
    // ========================================================================
    this.logger.log('📂 Creating categories...');

    const categories = [
      { name: 'Frontend Development', slug: 'frontend', color: '#3b82f6', icon: 'Code' },
      { name: 'Backend Development', slug: 'backend', color: '#ef4444', icon: 'Database' },
      { name: 'Data Science', slug: 'data-science', color: '#10b981', icon: 'BarChart' },
      { name: 'DevOps & Cloud', slug: 'devops', color: '#8b5cf6', icon: 'Layers' },
      { name: 'Mobile Development', slug: 'mobile', color: '#f59e0b', icon: 'Smartphone' },
      { name: 'Cybersecurity', slug: 'cybersecurity', color: '#dc2626', icon: 'Shield' },
      { name: 'UI/UX Design', slug: 'ui-ux', color: '#ec4899', icon: 'PenTool' },
      { name: 'Career & Interview Prep', slug: 'career', color: '#059669', icon: 'Briefcase' },
    ];

    const createdCategories: any[] = [];
    for (const cat of categories) {
      const c = await this.prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      });
      createdCategories.push(c);
    }

    this.logger.log(`✅ Created ${createdCategories.length} categories`);

    // ========================================================================
    // 3. COURSES
    // ========================================================================
    this.logger.log('📚 Creating courses...');

    const courses = [
      {
        title: 'React Mastery: From Basics to Advanced',
        slug: 'react-mastery',
        shortDescription: 'Build modern web applications with React, Hooks, and TypeScript',
        description:
          'Complete React course covering fundamentals, advanced patterns, hooks, context API, and real-world projects. Go from beginner to job-ready with hands-on projects.',
        type: CourseType.PAID,
        price: 89.99,
        level: 'Intermediate',
        duration: '12 weeks',
        thumbnail:
          'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
        instructorId: staff1.id,
        categoryId: createdCategories[0].id,
        isPublished: true,
        isFeatured: true,
        requirements: JSON.stringify([
          'Basic HTML, CSS, and JavaScript knowledge',
          'Understanding of ES6+ features',
          'A code editor (VS Code recommended)',
        ]),
        outcomes: JSON.stringify([
          'Build modern React applications with Hooks',
          'Master state management with Context API and Redux',
          'Create reusable components and custom hooks',
          'Deploy React applications to production',
          'Pass technical React interviews',
        ]),
        targetAudience: 'Frontend developers, JavaScript developers, career switchers',
      },
      {
        title: 'Node.js Backend Development',
        slug: 'nodejs-backend',
        shortDescription: 'Create REST APIs with Node.js, Express, and PostgreSQL',
        description:
          'Learn backend development with Node.js, Express, authentication, database integration, and deployment. Build production-ready APIs.',
        type: CourseType.PAID,
        price: 79.99,
        level: 'Beginner',
        duration: '10 weeks',
        thumbnail:
          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=800&auto=format&fit=crop',
        instructorId: staff1.id,
        categoryId: createdCategories[1].id,
        isPublished: true,
        isFeatured: true,
        requirements: JSON.stringify([
          'Basic JavaScript knowledge',
          'Understanding of HTTP and REST concepts',
        ]),
        outcomes: JSON.stringify([
          'Build REST APIs with Express',
          'Integrate MongoDB and PostgreSQL databases',
          'Implement JWT authentication',
          'Deploy Node.js applications',
        ]),
        targetAudience: 'Backend developers, full-stack developers, beginners',
      },
      {
        title: 'Python for Data Science',
        slug: 'python-data-science',
        shortDescription: 'Learn Python, pandas, NumPy, and machine learning',
        description:
          'Comprehensive data science course with Python, covering analysis, visualization, statistics, and machine learning fundamentals.',
        type: CourseType.FREE,
        price: 0,
        level: 'Beginner',
        duration: '8 weeks',
        thumbnail:
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
        instructorId: staff2.id,
        categoryId: createdCategories[2].id,
        isPublished: true,
        isFeatured: false,
        requirements: JSON.stringify(['Basic programming concepts', 'High school level math']),
        outcomes: JSON.stringify([
          'Master Python fundamentals',
          'Data manipulation with pandas',
          'Numerical computing with NumPy',
          'Data visualization with matplotlib',
          'Machine learning with scikit-learn',
        ]),
        targetAudience: 'Data analysts, aspiring data scientists, Python beginners',
      },
      {
        title: 'TypeScript Professional',
        slug: 'typescript-professional',
        shortDescription: 'Master TypeScript types, interfaces, and generics',
        description:
          'Deep dive into TypeScript - types, interfaces, generics, decorators, and building type-safe applications.',
        type: CourseType.PAID,
        price: 59.99,
        level: 'Intermediate',
        duration: '6 weeks',
        thumbnail:
          'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?q=80&w=800&auto=format&fit=crop',
        instructorId: staff2.id,
        categoryId: createdCategories[0].id,
        isPublished: true,
        isFeatured: false,
        requirements: JSON.stringify(['Basic JavaScript knowledge', 'Understanding of ES6+ features']),
        outcomes: JSON.stringify([
          'Master TypeScript type system',
          'Build type-safe applications',
          'Use generics and advanced types',
          'Migrate JavaScript projects to TypeScript',
        ]),
        targetAudience: 'JavaScript developers, frontend engineers',
      },
      {
        title: 'Go Programming for Engineers',
        slug: 'go-programming',
        shortDescription: 'Build concurrent, high-performance systems with Go',
        description:
          'Learn Go (Golang) - concurrency, channels, interfaces, and building scalable backend services.',
        type: CourseType.PAID,
        price: 94.99,
        level: 'Intermediate',
        duration: '8 weeks',
        thumbnail:
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
        instructorId: staff1.id,
        categoryId: createdCategories[1].id,
        isPublished: true,
        isFeatured: false,
        requirements: JSON.stringify([
          'Basic programming knowledge',
          'Understanding of computer science fundamentals',
        ]),
        outcomes: JSON.stringify([
          'Master Go syntax and concurrency',
          'Build microservices with Go',
          'Work with channels and goroutines',
          'Deploy Go applications',
        ]),
        targetAudience: 'Backend engineers, systems programmers',
      },
      {
        title: 'System Design Interview Prep',
        slug: 'system-design-interview',
        shortDescription: 'Design scalable distributed systems',
        description:
          'Master system design concepts for technical interviews. Learn load balancing, caching, database sharding, and more.',
        type: CourseType.PAID,
        price: 129.99,
        level: 'Advanced',
        duration: '6 weeks',
        thumbnail:
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
        instructorId: staff1.id,
        categoryId: createdCategories[7].id,
        isPublished: true,
        isFeatured: true,
        requirements: JSON.stringify([
          'Software development experience',
          'Understanding of distributed systems basics',
        ]),
        outcomes: JSON.stringify([
          'Design scalable system architectures',
          'Pass system design interviews',
          'Understand CAP theorem, consistency models',
          'Design databases, caches, message queues',
        ]),
        targetAudience: 'Senior developers, engineering candidates',
      },
      {
        title: 'DevOps Essentials: Docker & Kubernetes',
        slug: 'devops-essentials',
        shortDescription: 'Containerization and orchestration with Docker and K8s',
        description:
          'Learn Docker containers, Kubernetes orchestration, CI/CD pipelines, and cloud deployment strategies.',
        type: CourseType.PARTIAL,
        price: 69.99,
        level: 'Intermediate',
        duration: '5 weeks',
        thumbnail:
          'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop',
        instructorId: staff2.id,
        categoryId: createdCategories[3].id,
        isPublished: true,
        isFeatured: false,
        requirements: JSON.stringify([
          'Basic Linux command line knowledge',
          'Understanding of software deployment',
        ]),
        outcomes: JSON.stringify([
          'Master Docker containers and images',
          'Deploy applications with Kubernetes',
          'Build CI/CD pipelines',
          'Manage cloud infrastructure',
        ]),
        targetAudience: 'DevOps engineers, backend developers, SREs',
      },
      {
        title: 'UI/UX Design Fundamentals',
        slug: 'ui-ux-fundamentals',
        shortDescription: 'Learn user interface and user experience design',
        description:
          'Comprehensive UI/UX design course covering design principles, Figma, user research, and prototyping.',
        type: CourseType.PAID,
        price: 74.99,
        level: 'Beginner',
        duration: '7 weeks',
        thumbnail:
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop',
        instructorId: staff2.id,
        categoryId: createdCategories[6].id,
        isPublished: true,
        isFeatured: false,
        requirements: JSON.stringify([
          'No prior design experience required',
          'A computer with Figma access',
        ]),
        outcomes: JSON.stringify([
          'Master UI design principles',
          'Create wireframes and prototypes in Figma',
          'Conduct user research',
          'Build design systems',
        ]),
        targetAudience: 'Aspiring designers, developers, product managers',
      },
    ];

    const createdCourses: any[] = [];
    for (const course of courses) {
      const c = await this.prisma.course.upsert({
        where: { slug: course.slug },
        update: {},
        create: course,
      });
      createdCourses.push(c);
    }

    this.logger.log(`✅ Created ${createdCourses.length} courses`);

    // ========================================================================
    // 4. MODULES & LESSONS (idempotent)
    // ========================================================================
    this.logger.log('📦 Creating modules and lessons...');

    for (const course of createdCourses) {
      const existingModules = await this.prisma.module.count({
        where: { courseId: course.id },
      });
      if (existingModules > 0) continue;

      const moduleCount = 4;
      for (let m = 0; m < moduleCount; m++) {
        const module = await this.prisma.module.create({
          data: {
            title: `Module ${m + 1}: ${this.getModuleTitle(course.title, m + 1)}`,
            description: `Learn the fundamentals of module ${m + 1} in ${course.title}`,
            order: m + 1,
            courseId: course.id,
          },
        });

        for (let l = 0; l < 4; l++) {
          const lessonTypes = [
            LessonType.VIDEO,
            LessonType.VIDEO,
            LessonType.YOUTUBE,
            LessonType.SLIDE,
            LessonType.DOC,
          ];
          const lessonType = lessonTypes[l % lessonTypes.length];
          const isFree = l === 0;

          await this.prisma.lesson.create({
            data: {
              title: this.getLessonTitle(course.title, l + 1),
              description: `Lesson ${l + 1} content for ${module.title}`,
              readingContent: this.buildLessonReading(
                course.title,
                module.title,
                this.getLessonTitle(course.title, l + 1),
              ),
              type: lessonType,
              contentUrl:
                lessonType === LessonType.YOUTUBE
                  ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                  : lessonType === LessonType.VIDEO
                  ? 'https://example.com/video.mp4'
                  : undefined,
              duration: 15 + l * 5,
              order: l + 1,
              isFree,
              isPublished: true,
              moduleId: module.id,
            },
          });
        }
      }
    }

    // Backfill reading guides for lessons created before Study mode existed.
    const lessonsMissingReading = await this.prisma.lesson.findMany({
      where: { readingContent: null },
      include: { module: { include: { course: { select: { title: true } } } } },
    });
    for (const lesson of lessonsMissingReading) {
      await this.prisma.lesson.update({
        where: { id: lesson.id },
        data: {
          readingContent: this.buildLessonReading(
            lesson.module.course.title,
            lesson.module.title,
            lesson.title,
          ),
        },
      });
    }

    this.logger.log('✅ Created modules and lessons');

    // ========================================================================
    // 5. ENROLLMENTS
    // ========================================================================
    this.logger.log('📝 Creating enrollments...');

    const enrollmentData = [
      { userId: student1.id, courseId: createdCourses[0].id, status: 'ACTIVE' as const, progress: 45 },
      { userId: student1.id, courseId: createdCourses[1].id, status: 'ACTIVE' as const, progress: 20 },
      { userId: student2.id, courseId: createdCourses[2].id, status: 'COMPLETED' as const, progress: 100 },
      { userId: student2.id, courseId: createdCourses[3].id, status: 'COMPLETED' as const, progress: 100 },
      { userId: student3.id, courseId: createdCourses[0].id, status: 'ACTIVE' as const, progress: 75 },
      { userId: student3.id, courseId: createdCourses[5].id, status: 'ACTIVE' as const, progress: 10 },
    ];

    for (const e of enrollmentData) {
      await this.prisma.enrollment.upsert({
        where: { userId_courseId: { userId: e.userId, courseId: e.courseId } },
        update: {},
        create: {
          ...e,
          lastAccessedAt: new Date(),
          completedAt: e.status === 'COMPLETED' ? new Date() : null,
        },
      });
    }

    this.logger.log('✅ Created enrollments');

    // Back the seeded percentage with real lesson progress so the dashboard
    // and the course player agree on what has been completed.
    for (const e of enrollmentData) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: e.userId, courseId: e.courseId } },
      });
      if (!enrollment) continue;

      const modules = await this.prisma.module.findMany({
        where: { courseId: e.courseId },
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } },
      });
      const lessons = modules.flatMap((m) => m.lessons);
      if (lessons.length === 0) continue;

      const completedCount = Math.round((e.progress / 100) * lessons.length);

      for (let i = 0; i < completedCount; i++) {
        await this.prisma.lessonProgress.upsert({
          where: {
            enrollmentId_lessonId: {
              enrollmentId: enrollment.id,
              lessonId: lessons[i].id,
            },
          },
          update: { isCompleted: true, progress: 100, watchedAt: new Date() },
          create: {
            enrollmentId: enrollment.id,
            lessonId: lessons[i].id,
            userId: e.userId,
            isCompleted: true,
            progress: 100,
            watchedAt: new Date(),
          },
        });
      }

      // Keep the stored percentage in sync with the lessons we just marked.
      const progress = (completedCount / lessons.length) * 100;
      await this.prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { progress },
      });
    }

    this.logger.log('✅ Created lesson progress');

    // ========================================================================
    // 6. ASSIGNMENTS & SUBMISSIONS
    // ========================================================================
    this.logger.log('📋 Creating assignments...');

    const assignmentSeed = [
      {
        course: createdCourses[0],
        title: 'Build a Todo App with React Hooks',
        description: 'Create a todo application using useState, useEffect and localStorage.',
        instructions:
          'Submit a GitHub repository link and a short write-up explaining your component structure and state management choices.',
        type: 'PROJECT',
        days: 7,
      },
      {
        course: createdCourses[0],
        title: 'Custom Hook Deep Dive',
        description: 'Extract reusable logic into a custom hook and document it.',
        instructions: 'Submit the hook source code plus a usage example.',
        type: 'TEXT',
        days: 14,
      },
      {
        course: createdCourses[1],
        title: 'REST API with JWT Auth',
        description: 'Build a small Express API with authentication and one protected route.',
        instructions: 'Submit repository link and API documentation.',
        type: 'PROJECT',
        days: 10,
      },
      {
        course: createdCourses[2],
        title: 'Exploratory Data Analysis',
        description: 'Analyse a public dataset and present three insights.',
        instructions: 'Submit a notebook or PDF report with visualisations.',
        type: 'FILE',
        days: 5,
      },
    ];

    for (const seedAssignment of assignmentSeed) {
      const existing = await this.prisma.assignment.findFirst({
        where: { courseId: seedAssignment.course.id, title: seedAssignment.title },
      });
      if (existing) continue;

      await this.prisma.assignment.create({
        data: {
          courseId: seedAssignment.course.id,
          title: seedAssignment.title,
          description: seedAssignment.description,
          instructions: seedAssignment.instructions,
          type: seedAssignment.type,
          maxScore: 100,
          dueAt: new Date(Date.now() + seedAssignment.days * 24 * 60 * 60 * 1000),
          isPublished: true,
          createdById: seedAssignment.course.instructorId,
        },
      });
    }

    const firstAssignment = await this.prisma.assignment.findFirst({
      where: { courseId: createdCourses[0].id },
    });
    if (firstAssignment) {
      const existingSubmission = await this.prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_userId: { assignmentId: firstAssignment.id, userId: student1.id },
        },
      });
      if (!existingSubmission) {
        await this.prisma.assignmentSubmission.create({
          data: {
            assignmentId: firstAssignment.id,
            userId: student1.id,
            content:
              'Here is my todo app: https://github.com/example/react-todo. I used useReducer for state and a custom useLocalStorage hook.',
            status: AssignmentStatus.GRADED,
            score: 92,
            feedback: 'Great structure and clean hooks. Consider adding tests next time.',
            gradedAt: new Date(),
            gradedById: staff1.id,
          },
        });
      }
    }

    this.logger.log('✅ Created assignments');

    // ========================================================================
    // 7. CERTIFICATES
    // ========================================================================
    this.logger.log('📜 Creating certificates...');

    const completedEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId: student2.id, courseId: createdCourses[3].id },
      },
    });

    if (completedEnrollment) {
      await this.prisma.certificate.upsert({
        where: { userId_courseId: { userId: student2.id, courseId: createdCourses[3].id } },
        update: {},
        create: {
          userId: student2.id,
          courseId: createdCourses[3].id,
          enrollmentId: completedEnrollment.id,
          certificateCode: 'CERT-TS2026-001',
          grade: 'A',
          score: 100,
        },
      });
    }

    this.logger.log('✅ Created certificates');

    // ========================================================================
    // 8. PAYMENTS
    // ========================================================================
    this.logger.log('💳 Creating payments...');

    await this.prisma.payment.createMany({
      data: [
        {
          userId: student1.id,
          courseId: createdCourses[0].id,
          amount: 89.99,
          currency: 'USD',
          status: 'COMPLETED',
          paymentMethod: 'stripe',
          transactionId: 'txn_stu1_course1',
          paidAt: new Date(),
        },
        {
          userId: student2.id,
          courseId: createdCourses[3].id,
          amount: 59.99,
          currency: 'USD',
          status: 'COMPLETED',
          paymentMethod: 'paypal',
          transactionId: 'txn_stu2_course3',
          paidAt: new Date(),
        },
        {
          userId: student3.id,
          courseId: createdCourses[0].id,
          amount: 89.99,
          currency: 'USD',
          status: 'PENDING',
          paymentMethod: 'stripe',
          transactionId: 'txn_stu3_course1',
        },
      ],
      skipDuplicates: true,
    });

    this.logger.log('✅ Created payments');

    // ========================================================================
    // 9. JOBS
    // ========================================================================
    this.logger.log('💼 Creating jobs...');

    const jobs = [
      {
        title: 'Senior Frontend Engineer',
        slug: 'senior-frontend-engineer-techflow',
        company: 'TechFlow Inc.',
        companyLogo:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop',
        location: 'San Francisco, CA',
        isRemote: true,
        type: JobType.FULL_TIME,
        level: 'Senior',
        salaryMin: 140000,
        salaryMax: 180000,
        description:
          'We are looking for a Senior Frontend Engineer to help us build a next-generation collaboration platform used by thousands of teams.',
        requirements:
          '5+ years of frontend experience\nExpert knowledge of React and TypeScript\nExperience with design systems and accessibility\nStrong communication skills',
        responsibilities:
          'Lead frontend architecture decisions\nMentor junior engineers\nPartner with design and product teams\nShip high-quality, tested UI',
        benefits: 'Remote-first\nHealth insurance\nLearning budget\nEquity',
        tags: 'React,TypeScript,Next.js,Remote',
        isPublished: true,
        isFeatured: true,
      },
      {
        title: 'Backend Engineer (Node.js)',
        slug: 'backend-engineer-cloudscale',
        company: 'CloudScale',
        companyLogo:
          'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=200&auto=format&fit=crop',
        location: 'New York, NY',
        isRemote: false,
        type: JobType.FULL_TIME,
        level: 'Mid',
        salaryMin: 130000,
        salaryMax: 160000,
        description:
          'Design and implement scalable backend services that power our cloud infrastructure products.',
        requirements:
          '3+ years with Node.js or Go\nStrong SQL and PostgreSQL knowledge\nExperience with queues and caching\nTesting mindset',
        responsibilities:
          'Build and maintain APIs\nOwn service reliability\nParticipate in on-call rotation',
        benefits: 'Hybrid work\n401k match\nConference budget',
        tags: 'Node.js,PostgreSQL,AWS',
        isPublished: true,
        isFeatured: true,
      },
      {
        title: 'Data Scientist',
        slug: 'data-scientist-datamind',
        company: 'DataMind AI',
        companyLogo:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop',
        location: 'Austin, TX',
        isRemote: true,
        type: JobType.FULL_TIME,
        level: 'Mid',
        salaryMin: 150000,
        salaryMax: 200000,
        description:
          'Build machine learning models and data pipelines that turn raw data into product insight.',
        requirements:
          'Strong Python and pandas\nExperience with scikit-learn or PyTorch\nSQL fluency\nExcellent storytelling with data',
        responsibilities:
          'Develop models end to end\nCollaborate with product teams\nCommunicate findings clearly',
        benefits: 'Remote\nFlexible hours\nEquity',
        tags: 'Python,Machine Learning,SQL,Remote',
        isPublished: true,
        isFeatured: false,
      },
      {
        title: 'DevOps Engineer',
        slug: 'devops-engineer-deployfast',
        company: 'DeployFast',
        companyLogo:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=200&auto=format&fit=crop',
        location: 'Remote',
        isRemote: true,
        type: JobType.CONTRACT,
        level: 'Senior',
        salaryMin: 90,
        salaryMax: 130,
        description:
          'Help us build and maintain reliable CI/CD pipelines and cloud infrastructure for fast-growing startups.',
        requirements:
          'Deep AWS knowledge\nDocker and Kubernetes\nTerraform or similar IaC\nCI/CD experience',
        responsibilities:
          'Automate deployments\nImprove observability\nHarden infrastructure security',
        benefits: 'Fully remote\nFlexible schedule',
        tags: 'AWS,Docker,Kubernetes,Terraform',
        isPublished: true,
        isFeatured: false,
      },
      {
        title: 'Full-Stack Developer',
        slug: 'full-stack-developer-startuplabs',
        company: 'StartupLabs',
        companyLogo:
          'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=200&auto=format&fit=crop',
        location: 'Seattle, WA',
        isRemote: false,
        type: JobType.FULL_TIME,
        level: 'Junior',
        salaryMin: 95000,
        salaryMax: 120000,
        description:
          'Join an early-stage startup as a founding engineer and shape the product from day one.',
        requirements:
          '1-3 years experience\nReact and Node.js\nComfortable with ambiguity\nHungry to learn',
        responsibilities:
          'Ship features across the stack\nTalk to customers\nImprove developer experience',
        benefits: 'Equity\nMentorship\nHealth insurance',
        tags: 'React,Node.js,MongoDB',
        isPublished: true,
        isFeatured: false,
      },
      {
        title: 'UI/UX Design Intern',
        slug: 'ui-ux-design-intern-tweacktech',
        company: 'TweackTech',
        companyLogo:
          'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=200&auto=format&fit=crop',
        location: 'Remote',
        isRemote: true,
        type: JobType.INTERNSHIP,
        level: 'Junior',
        salaryMin: 500,
        salaryMax: 900,
        description:
          'Work with our product team to design learning experiences for developers across Africa and beyond.',
        requirements:
          'Portfolio with 2+ projects\nFigma proficiency\nCuriosity about education',
        responsibilities:
          'Design wireframes and prototypes\nRun usability tests\nContribute to our design system',
        benefits: 'Remote\nMentorship\nCertificate',
        tags: 'Figma,UI,UX,Remote',
        isPublished: true,
        isFeatured: false,
      },
    ];

    for (const job of jobs) {
      await this.prisma.job.upsert({
        where: { slug: job.slug },
        update: {},
        create: {
          ...job,
          postedById: staff1.id,
          publishedAt: new Date(),
        },
      });
    }

    this.logger.log('✅ Created jobs');

    // ========================================================================
    // 10. BLOG POSTS
    // ========================================================================
    this.logger.log('📝 Creating blog posts...');

    const posts = [
      {
        title: '10 React Best Practices for 2026',
        slug: '10-react-best-practices-2026',
        excerpt:
          'Level up your React development with these essential best practices for modern web applications.',
        content:
          '<h2>Introduction</h2><p>React continues to dominate frontend development. These practices will help you write cleaner, faster, and more maintainable code.</p><h2>1. Keep components small</h2><p>Small components are easier to test and reason about.</p><h2>2. Use hooks thoughtfully</h2><p>Custom hooks are a great way to share logic without sharing UI.</p>',
        featuredImage:
          'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
        isPublished: true,
        isFeatured: true,
        authorId: staff1.id,
        categoryId: createdCategories[0].id,
        tags: 'React,Frontend,Best Practices',
      },
      {
        title: 'Node.js vs Python: Which Backend to Choose?',
        slug: 'nodejs-vs-python-backend',
        excerpt: 'Comparing Node.js and Python for backend development - pros, cons, and use cases.',
        content:
          '<h2>Overview</h2><p>When choosing a backend technology, consider your team, your product, and your performance needs.</p><h2>Node.js</h2><p>Great for real-time apps and JavaScript teams.</p><h2>Python</h2><p>Excellent for data-heavy products and rapid prototyping.</p>',
        featuredImage:
          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=800&auto=format&fit=crop',
        isPublished: true,
        isFeatured: false,
        authorId: staff2.id,
        categoryId: createdCategories[1].id,
        tags: 'Node.js,Python,Backend',
      },
      {
        title: 'Getting Started with Data Science',
        slug: 'getting-started-data-science',
        excerpt: "A beginner's guide to data science with Python, pandas, and machine learning.",
        content:
          '<h2>What is Data Science?</h2><p>Data science combines statistics, programming, and domain knowledge to extract insight from data.</p><h2>Your first steps</h2><p>Learn Python, then pandas, then visualisation, then machine learning.</p>',
        featuredImage:
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
        isPublished: true,
        isFeatured: false,
        authorId: staff1.id,
        categoryId: createdCategories[2].id,
        tags: 'Data Science,Python,Machine Learning',
      },
      {
        title: 'Career Tips: Getting Your First Developer Job',
        slug: 'career-tips-first-developer-job',
        excerpt: 'Practical tips for landing your first software engineering role.',
        content:
          '<h2>Introduction</h2><p>Breaking into tech can be challenging, but a focused plan makes it much easier.</p><h2>Build projects</h2><p>Projects show what you can do better than any certificate alone.</p><h2>Practise interviews</h2><p>Consistent practice beats last-minute cramming.</p>',
        featuredImage:
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop',
        isPublished: true,
        isFeatured: false,
        authorId: admin.id,
        categoryId: createdCategories[7].id,
        tags: 'Career,Jobs,Interview',
      },
    ];

    for (const post of posts) {
      await this.prisma.blogPost.upsert({
        where: { slug: post.slug },
        update: {},
        create: { ...post, publishedAt: new Date() },
      });
    }

    this.logger.log('✅ Created blog posts');

    // ========================================================================
    // 11. LEGAL PAGES
    // ========================================================================
    this.logger.log('⚖️ Creating legal pages...');

    await this.prisma.privacyPolicy.upsert({
      where: { id: 'privacy-policy-default' },
      update: {},
      create: {
        id: 'privacy-policy-default',
        title: 'Privacy Policy',
        content: this.getPrivacyPolicyContent(),
        version: '1.0',
        isActive: true,
        updatedBy: superAdmin.id,
      },
    });

    await this.prisma.termsOfService.upsert({
      where: { id: 'terms-default' },
      update: {},
      create: {
        id: 'terms-default',
        title: 'Terms of Service',
        content: this.getTermsContent(),
        version: '1.0',
        isActive: true,
        updatedBy: superAdmin.id,
      },
    });

    this.logger.log('✅ Created legal pages');

    // ========================================================================
    // 12. SUPPORT TICKETS
    // ========================================================================
    this.logger.log('🎫 Creating support tickets...');

    await this.prisma.supportTicket.createMany({
      data: [
        {
          ticketNumber: 'TKT-2026-001',
          subject: 'Cannot access course videos',
          description: 'I am unable to play videos in the React Mastery course.',
          status: TicketStatus.RESOLVED,
          priority: TicketPriority.HIGH,
          category: 'technical',
          userId: student1.id,
          assignedTo: staff1.id,
          resolvedAt: new Date(),
        },
        {
          ticketNumber: 'TKT-2026-002',
          subject: 'Payment not reflecting',
          description: 'I paid for Node.js course but enrollment is not active.',
          status: TicketStatus.IN_PROGRESS,
          priority: TicketPriority.URGENT,
          category: 'billing',
          userId: student3.id,
          assignedTo: admin.id,
        },
        {
          ticketNumber: 'TKT-2026-003',
          subject: 'Certificate download issue',
          description: 'Unable to download my Python certificate PDF.',
          status: TicketStatus.OPEN,
          priority: TicketPriority.MEDIUM,
          category: 'account',
          userId: student2.id,
        },
      ],
      skipDuplicates: true,
    });

    this.logger.log('✅ Created support tickets');

    // ========================================================================
    // 13. CURRENCIES, BANK ACCOUNTS, TALENT, CHAT, CALENDAR, QUIZ
    // ========================================================================
    this.logger.log('💱 Creating currencies and bank accounts...');

    await this.prisma.currencyRate.createMany({
      data: [
        { code: 'USD', name: 'US Dollar', symbol: '$', rateFromUsd: 1 },
        { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', rateFromUsd: 1600 },
        { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', rateFromUsd: 15.5 },
        { code: 'GBP', name: 'British Pound', symbol: '£', rateFromUsd: 0.79 },
        { code: 'EUR', name: 'Euro', symbol: '€', rateFromUsd: 0.92 },
      ],
      skipDuplicates: true,
    });

    if ((await this.prisma.bankAccount.count()) === 0) {
      await this.prisma.bankAccount.createMany({
        data: [
          {
            bankName: 'GTBank',
            accountName: 'TweackTech Ltd',
            accountNumber: '0123456789',
            currency: 'NGN',
            branch: 'Lagos Island',
            instructions: 'Use your payment reference as the transfer narration.',
          },
          {
            bankName: 'Access Bank',
            accountName: 'TweackTech Ltd',
            accountNumber: '0987654321',
            currency: 'NGN',
            branch: 'Victoria Island',
          },
          {
            bankName: 'GCB Bank',
            accountName: 'TweackTech Ltd',
            accountNumber: '1234567890',
            currency: 'GHS',
            branch: 'Accra Main',
          },
        ],
      });
    }

    this.logger.log('✅ Created currencies and bank accounts');

    this.logger.log('🧑‍💻 Creating Talent Hub profiles...');

    const talentSeeds = [
      {
        userId: staff1.id,
        headline: 'Senior Full-Stack Developer & Instructor',
        bio: 'Full-stack engineer specialising in React, Node.js and cloud-native APIs. I have shipped products for startups and enterprises and love teaching practical, job-ready skills.',
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
        experienceYears: 7,
        hourlyRate: 80,
        currency: 'USD',
        availability: 'Available',
        location: 'San Francisco, CA',
        isPublished: true,
        isFeatured: true,
      },
      {
        userId: staff2.id,
        headline: 'React & TypeScript Expert',
        bio: 'Frontend specialist focused on design systems, accessibility and performant React applications. Available for freelance builds and code reviews.',
        skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Figma'],
        experienceYears: 5,
        hourlyRate: 90,
        currency: 'USD',
        availability: 'Available',
        location: 'New York, NY',
        isPublished: true,
        isFeatured: true,
      },
      {
        userId: admin.id,
        headline: 'Platform Engineer & DevOps Consultant',
        bio: 'I help teams ship reliably with Docker, Kubernetes and CI/CD pipelines.',
        skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
        experienceYears: 6,
        hourlyRate: 75,
        currency: 'USD',
        availability: 'Busy',
        location: 'Abuja, Nigeria',
        isPublished: true,
        isFeatured: false,
      },
    ];

    for (const talent of talentSeeds) {
      await this.prisma.talentProfile.upsert({
        where: { userId: talent.userId },
        update: {},
        create: talent,
      });
    }

    this.logger.log('✅ Created talent profiles');

    // Co-instructors demonstrate the instructor-assignment feature.
    await this.prisma.courseInstructor.createMany({
      data: [{ courseId: createdCourses[0].id, userId: staff2.id }],
      skipDuplicates: true,
    });

    // A future live session for the calendar + reminder worker.
    const existingSession = await this.prisma.liveSession.findFirst({
      where: { courseId: createdCourses[0].id, title: 'React Q&A and code review' },
    });
    if (!existingSession) {
      await this.prisma.liveSession.create({
        data: {
          courseId: createdCourses[0].id,
          instructorId: staff1.id,
          title: 'React Q&A and code review',
          description: 'Bring your React questions and a component you want reviewed.',
          meetingUrl: 'https://meet.google.com/tweacktech-demo',
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
          timezone: 'Africa/Lagos',
          reminderMinutesBefore: 60,
          maxAttendees: 100,
        },
      });
    }

    // Course chat room with the instructor and enrolled students.
    const courseRoom = await this.prisma.chatRoom.upsert({
      where: {
        courseId_type: { courseId: createdCourses[0].id, type: 'COURSE' },
      },
      update: {},
      create: {
        courseId: createdCourses[0].id,
        type: 'COURSE',
        name: `${createdCourses[0].title} · Class chat`,
        createdById: staff1.id,
      },
    });
    const chatMembers = [
      { userId: staff1.id, role: 'MODERATOR' as const },
      { userId: staff2.id, role: 'MODERATOR' as const },
      { userId: student1.id, role: 'MEMBER' as const },
      { userId: student3.id, role: 'MEMBER' as const },
    ];
    for (const member of chatMembers) {
      await this.prisma.chatRoomMember.upsert({
        where: { roomId_userId: { roomId: courseRoom.id, userId: member.userId } },
        update: {},
        create: {
          roomId: courseRoom.id,
          userId: member.userId,
          role: member.role,
        },
      });
    }
    const existingWelcome = await this.prisma.chatMessage.findFirst({
      where: { roomId: courseRoom.id },
    });
    if (!existingWelcome) {
      await this.prisma.chatMessage.create({
        data: {
          roomId: courseRoom.id,
          senderId: staff1.id,
          body: 'Welcome to the React Mastery class chat! Ask questions here and share your progress. 🚀',
        },
      });
    }

    // A demo quiz with auto-marking.
    const existingQuiz = await this.prisma.assignment.findFirst({
      where: { courseId: createdCourses[0].id, type: 'QUIZ' },
    });
    if (!existingQuiz) {
      await this.prisma.assignment.create({
        data: {
          courseId: createdCourses[0].id,
          createdById: staff1.id,
          title: 'React Fundamentals Quiz',
          description: 'A quick check of React fundamentals. Auto-marked on submit.',
          type: 'QUIZ',
          maxScore: 10,
          passScore: 6,
          autoGrade: true,
          isPublished: true,
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          questions: {
            create: [
              {
                prompt: 'What hook lets you add local state to a function component?',
                type: 'SINGLE_CHOICE',
                points: 1,
                order: 1,
                explanation: 'useState returns a state value and an updater function.',
                options: {
                  create: [
                    { text: 'useState', isCorrect: true, order: 1 },
                    { text: 'useFetch', isCorrect: false, order: 2 },
                    { text: 'useRouter', isCorrect: false, order: 3 },
                    { text: 'useStyle', isCorrect: false, order: 4 },
                  ],
                },
              },
              {
                prompt: 'What does JSX stand for?',
                type: 'SINGLE_CHOICE',
                points: 1,
                order: 2,
                explanation: 'JSX is a syntax extension that looks like HTML inside JavaScript.',
                options: {
                  create: [
                    { text: 'JavaScript XML', isCorrect: true, order: 1 },
                    { text: 'JavaScript Extra', isCorrect: false, order: 2 },
                    { text: 'JSON XML', isCorrect: false, order: 3 },
                    { text: 'Java Syntax Extension', isCorrect: false, order: 4 },
                  ],
                },
              },
              {
                prompt: 'Which hook runs side effects after a render?',
                type: 'SINGLE_CHOICE',
                points: 1,
                order: 3,
                explanation: 'useEffect handles data fetching, subscriptions and DOM updates.',
                options: {
                  create: [
                    { text: 'useEffect', isCorrect: true, order: 1 },
                    { text: 'useState', isCorrect: false, order: 2 },
                    { text: 'useRef', isCorrect: false, order: 3 },
                    { text: 'useReducer', isCorrect: false, order: 4 },
                  ],
                },
              },
              {
                prompt: 'What does the key prop help React do?',
                type: 'SINGLE_CHOICE',
                points: 1,
                order: 4,
                explanation: 'Keys help React identify which list items changed, were added or removed.',
                options: {
                  create: [
                    { text: 'Identify list items between renders', isCorrect: true, order: 1 },
                    { text: 'Style list items automatically', isCorrect: false, order: 2 },
                    { text: 'Fetch data for each item', isCorrect: false, order: 3 },
                    { text: 'Sort the list alphabetically', isCorrect: false, order: 4 },
                  ],
                },
              },
              {
                prompt: 'How should props be treated inside a component?',
                type: 'SINGLE_CHOICE',
                points: 1,
                order: 5,
                explanation: 'Props are read-only. A component must never mutate its own props.',
                options: {
                  create: [
                    { text: 'As read-only values', isCorrect: true, order: 1 },
                    { text: 'As mutable local state', isCorrect: false, order: 2 },
                    { text: 'As global variables', isCorrect: false, order: 3 },
                    { text: 'As database records', isCorrect: false, order: 4 },
                  ],
                },
              },
              {
                prompt: 'When two sibling components need the same state, what is the usual pattern?',
                type: 'SINGLE_CHOICE',
                points: 1,
                order: 6,
                explanation: 'Lift the state to the closest common parent and pass it down as props.',
                options: {
                  create: [
                    { text: 'Lift state up to their common parent', isCorrect: true, order: 1 },
                    { text: 'Duplicate the state in both siblings', isCorrect: false, order: 2 },
                    { text: 'Store it in a global CSS variable', isCorrect: false, order: 3 },
                    { text: 'Read it from the URL hash', isCorrect: false, order: 4 },
                  ],
                },
              },
              {
                prompt: 'Which expression conditionally renders a paragraph only when isLoggedIn is true?',
                type: 'SINGLE_CHOICE',
                points: 1,
                order: 7,
                explanation: 'The && operator renders the right side only when the left side is truthy.',
                options: {
                  create: [
                    { text: '{isLoggedIn && <p>Welcome</p>}', isCorrect: true, order: 1 },
                    { text: '{if (isLoggedIn) <p>Welcome</p>}', isCorrect: false, order: 2 },
                    { text: '{isLoggedIn ?: <p>Welcome</p>}', isCorrect: false, order: 3 },
                    { text: '{for (isLoggedIn) <p>Welcome</p>}', isCorrect: false, order: 4 },
                  ],
                },
              },
              {
                prompt: 'What is useMemo mainly used for?',
                type: 'SINGLE_CHOICE',
                points: 1,
                order: 8,
                explanation: 'useMemo caches a computed value until its dependencies change.',
                options: {
                  create: [
                    { text: 'Memoising an expensive computed value', isCorrect: true, order: 1 },
                    { text: 'Creating a new DOM node', isCorrect: false, order: 2 },
                    { text: 'Replacing React Router', isCorrect: false, order: 3 },
                    { text: 'Sending HTTP requests', isCorrect: false, order: 4 },
                  ],
                },
              },
              {
                prompt: 'Which component is used to navigate between pages with React Router?',
                type: 'SINGLE_CHOICE',
                points: 1,
                order: 9,
                explanation: 'Link renders an anchor that navigates without a full page reload.',
                options: {
                  create: [
                    { text: 'Link', isCorrect: true, order: 1 },
                    { text: 'Anchor', isCorrect: false, order: 2 },
                    { text: 'Navigate', isCorrect: false, order: 3 },
                    { text: 'RouterView', isCorrect: false, order: 4 },
                  ],
                },
              },
              {
                prompt: 'What makes an input a controlled component in React?',
                type: 'SINGLE_CHOICE',
                points: 1,
                order: 10,
                explanation: 'React controls the value and updates state through onChange.',
                options: {
                  create: [
                    { text: 'Its value comes from state and is updated via onChange', isCorrect: true, order: 1 },
                    { text: 'It uses the required attribute', isCorrect: false, order: 2 },
                    { text: 'It is wrapped in a form tag', isCorrect: false, order: 3 },
                    { text: 'It has a placeholder', isCorrect: false, order: 4 },
                  ],
                },
              },
            ],
          },
        },
      });
    }

    await this.prisma.notification.createMany({
      data: [
        {
          userId: student1.id,
          type: 'SESSION',
          title: 'Live class: React Q&A and code review',
          body: 'Your instructor scheduled a live session in two days.',
          link: '/calendar',
        },
        {
          userId: student1.id,
          type: 'PAYMENT',
          title: 'Payment approved',
          body: 'Your payment for React Mastery is confirmed.',
          link: '/payments',
        },
      ],
      skipDuplicates: true,
    });

    this.logger.log('✅ Created chat, calendar, quiz and notifications');

    // ========================================================================
    // 14. SITE SETTINGS
    // ========================================================================
    this.logger.log('⚙️ Creating site settings...');

    await this.prisma.siteSetting.createMany({
      data: [
        { key: 'site_name', value: 'TweackTech LMS', type: 'string' },
        { key: 'site_description', value: 'Learn tech skills and get hired', type: 'string' },
        { key: 'maintenance_mode', value: 'false', type: 'boolean' },
        { key: 'registration_enabled', value: 'true', type: 'boolean' },
        { key: 'contact_email', value: 'tweackchech@gmail.com', type: 'string' },
      ],
      skipDuplicates: true,
    });

    this.logger.log('✅ Created site settings');

    this.logger.log('🎉 Comprehensive seeding complete!');
    this.logger.log('👑 Superadmin: meyorpop@gmail.com / password@123');
    this.logger.log('🛠️  Admin: admin@tweacktech.com / password@123');
    this.logger.log('👨‍🏫 Staff: staff@tweacktech.com / password@123');
    this.logger.log('🎓 Student: student@tweacktech.com / password@123');
  }

  private buildLessonReading(courseTitle: string, moduleTitle: string, lessonTitle: string): string {
    return `LESSON OVERVIEW
${lessonTitle} is part of ${moduleTitle} in the ${courseTitle} course. Work through this guide before or after watching the lesson; it is written so you can understand the topic from reading alone.

WHAT YOU WILL LEARN
- Explain the purpose of ${lessonTitle.toLowerCase()} in your own words.
- Recognise the key terms, tools and decisions introduced in this module.
- Apply the idea in a small, practical exercise.
- Identify common mistakes and how to avoid them.

GUIDED READING
Start by connecting this lesson to the previous one. Ask yourself what problem the topic solves and where you have seen a similar idea before. Write a one-sentence definition in your notes, then expand it with an example from a real project.

Next, break the topic into its moving parts. For each part, note its input, the action it performs and the result it produces. This input-process-output habit makes complex systems easier to reason about and is especially useful during debugging.

Finally, consider the trade-offs. Most engineering choices balance simplicity, performance, reliability and cost. Being able to explain those trade-offs is what separates someone who memorised a definition from someone who can use the concept professionally.

WORKED EXAMPLE
Imagine you are building a small feature for a learning platform. Identify where ${lessonTitle.toLowerCase()} appears, describe the simplest implementation, then list one way to make it more robust. Write the steps down before coding; clear thinking now saves debugging time later.

PRACTICE
1. Summarise this lesson in three bullet points.
2. Build a tiny example that uses the concept.
3. Break the example on purpose and explain the error message.
4. Write down one question you still have and bring it to the class chat.

KEY TAKEAWAYS
- ${lessonTitle} is a tool for solving a specific kind of problem, not a rule to memorise.
- Understand the inputs, outputs and trade-offs.
- Practise on a small example, then increase the complexity gradually.
- Review your notes before the next lesson and ask questions early.`;
  }

  private getModuleTitle(courseTitle: string, moduleNum: number): string {
    const titles: Record<string, string[]> = {
      'React Mastery: From Basics to Advanced': [
        'React Fundamentals',
        'Components & JSX',
        'State Management',
        'Hooks Deep Dive',
      ],
      'Node.js Backend Development': [
        'Node.js Basics',
        'Express Framework',
        'Database Integration',
        'Authentication',
      ],
      'Python for Data Science': [
        'Python Basics',
        'Data Manipulation',
        'Visualization',
        'Machine Learning',
      ],
    };
    const courseTitles = titles[courseTitle] || [
      'Introduction',
      'Core Concepts',
      'Advanced Topics',
      'Projects',
    ];
    return courseTitles[moduleNum - 1] || `Module ${moduleNum}`;
  }

  private getLessonTitle(courseTitle: string, lessonNum: number): string {
    const titles: Record<string, string[]> = {
      'React Mastery: From Basics to Advanced': [
        'What is React?',
        'JSX and Components',
        'Props and State',
        'useEffect Hook',
      ],
      'Node.js Backend Development': [
        'Node.js Runtime',
        'Express Server',
        'REST API Design',
        'Middleware',
      ],
      'Python for Data Science': [
        'Python Installation',
        'Variables and Types',
        'Lists and Dictionaries',
        'Introduction to pandas',
      ],
    };
    const courseTitles = titles[courseTitle] || [
      'Introduction',
      'Core Concepts',
      'Practice',
      'Summary',
    ];
    return courseTitles[lessonNum - 1] || `Lesson ${lessonNum}`;
  }

  private getPrivacyPolicyContent(): string {
    return `<h1>Privacy Policy</h1><p>Last updated: November 2026</p><p>TweackTech LMS ("we", "us", "our") operates the TweackTech learning management system and talent hub.</p><h2>Information We Collect</h2><p>We collect personal information including name, email, and course progress when you register and use our platform.</p><h2>How We Use Your Information</h2><p>We use your data to provide courses, track progress, issue certificates, and connect you with employers.</p><h2>Google AdSense</h2><p>We use Google AdSense to display ads. Google may use cookies to serve personalized ads.</p><h2>Contact</h2><p>Email: tweackchech@gmail.com</p>`;
  }

  private getTermsContent(): string {
    return `<h1>Terms of Service</h1><p>Last updated: November 2026</p><p>By using TweackTech LMS, you agree to these terms.</p><h2>Eligibility</h2><p>You must be at least 13 years old to use our platform.</p><h2>Account Responsibility</h2><p>You are responsible for maintaining the confidentiality of your account.</p><h2>Payments</h2><p>All course payments are processed securely through our payment partners.</p><h2>Termination</h2><p>We may suspend or terminate accounts that violate our terms.</p>`;
  }
}
