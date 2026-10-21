import { Routes } from '@angular/router';
import {
  adminAuthGuard,
  adminGuestGuard,
  authGuard,
  guestGuard,
  passwordExpiredGuard,
  permissionGuard,
} from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    title: 'Sign in · Paper Generator',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'forgot-password',
    title: 'Reset password · Paper Generator',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/password-reset/password-reset').then((m) => m.PasswordReset),
    data: { mode: 'forgot' },
  },
  {
    path: 'reset-password',
    title: 'Set a new password · Paper Generator',
    loadComponent: () =>
      import('./features/auth/password-reset/password-reset').then((m) => m.PasswordReset),
    data: { mode: 'reset' },
  },
  {
    path: 'admin/login',
    title: 'Super admin sign in · Paper Generator',
    canActivate: [adminGuestGuard],
    loadComponent: () =>
      import('./admin/features/admin-login/admin-login').then((m) => m.AdminLogin),
  },
  {
    path: 'admin/forgot-password',
    title: 'Admin password reset · Paper Generator',
    canActivate: [adminGuestGuard],
    loadComponent: () =>
      import('./admin/features/admin-password-reset/admin-password-reset').then(
        (m) => m.AdminPasswordReset,
      ),
    data: { mode: 'forgot' },
  },
  {
    path: 'admin/reset-password',
    title: 'Set a new admin password · Paper Generator',
    loadComponent: () =>
      import('./admin/features/admin-password-reset/admin-password-reset').then(
        (m) => m.AdminPasswordReset,
      ),
    data: { mode: 'reset' },
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () => import('./admin/layout/admin-shell').then((m) => m.AdminShell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Platform overview · Paper Generator',
        loadComponent: () =>
          import('./admin/features/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard),
      },
      {
        path: 'schools/new',
        title: 'Register a school · Paper Generator',
        loadComponent: () =>
          import('./admin/features/admin-school-register/admin-school-register').then(
            (m) => m.AdminSchoolRegister,
          ),
      },
      {
        path: 'schools/:id/edit',
        title: 'Edit school · Paper Generator',
        loadComponent: () =>
          import('./admin/features/admin-school-edit/admin-school-edit').then(
            (m) => m.AdminSchoolEdit,
          ),
      },
      {
        path: 'schools/:id',
        title: 'School details · Paper Generator',
        loadComponent: () =>
          import('./admin/features/admin-school-detail/admin-school-detail').then(
            (m) => m.AdminSchoolDetail,
          ),
      },
      {
        path: 'schools',
        title: 'Schools & Institutes · Paper Generator',
        loadComponent: () => import('./admin/features/schools/schools').then((m) => m.Schools),
      },
      {
        path: 'white-label',
        title: 'White-label Studio · Paper Generator',
        loadComponent: () =>
          import('./admin/features/white-label/white-label').then((m) => m.WhiteLabel),
      },
      {
        path: 'plans/new',
        title: 'New plan · Paper Generator',
        loadComponent: () => import('./admin/features/plan-form/plan-form').then((m) => m.PlanForm),
      },
      {
        path: 'plans/:code/edit',
        title: 'Edit plan · Paper Generator',
        loadComponent: () => import('./admin/features/plan-form/plan-form').then((m) => m.PlanForm),
      },
      {
        path: 'plans',
        title: 'Plans & Billing · Paper Generator',
        loadComponent: () => import('./admin/features/plans/plans').then((m) => m.Plans),
      },
      {
        path: 'users',
        title: 'Platform Users · Paper Generator',
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Platform Users',
          description: 'Manage super admins, support agents and what they can access.',
          icon: 'users',
          backLink: '/admin/dashboard',
        },
      },
      {
        path: 'activity',
        title: 'Activity Log · Paper Generator',
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Activity Log',
          description: 'Audit every administrative action taken across the platform.',
          icon: 'activity',
          backLink: '/admin/dashboard',
        },
      },
      {
        path: 'settings',
        title: 'Platform Settings · Paper Generator',
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Platform Settings',
          description: 'Global defaults, email templates and integration keys.',
          icon: 'settings',
          backLink: '/admin/dashboard',
        },
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [passwordExpiredGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard · Paper Generator',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'users/new',
        title: 'Add user · Paper Generator',
        canActivate: [permissionGuard('users.manage')],
        loadComponent: () => import('./features/users/user-form').then((m) => m.UserForm),
      },
      {
        path: 'users/:id/edit',
        title: 'Edit user · Paper Generator',
        canActivate: [permissionGuard('users.manage')],
        loadComponent: () => import('./features/users/user-form').then((m) => m.UserForm),
      },
      {
        path: 'users',
        title: 'Users · Paper Generator',
        canActivate: [permissionGuard('users.view')],
        loadComponent: () => import('./features/users/users').then((m) => m.Users),
      },
      {
        path: 'users/teachers',
        title: 'Teachers · Paper Generator',
        canActivate: [permissionGuard('users.view')],
        data: { role: 'teacher', pageTitle: 'Teachers', pagePath: '/users/teachers' },
        loadComponent: () => import('./features/users/users').then((m) => m.Users),
      },
      {
        path: 'users/students/import',
        title: 'Import students · Paper Generator',
        canActivate: [permissionGuard('users.manage')],
        loadComponent: () => import('./features/users/student-import').then((m) => m.StudentImport),
      },
      {
        path: 'users/students',
        title: 'Students · Paper Generator',
        canActivate: [permissionGuard('users.view')],
        data: { role: 'student', pageTitle: 'Students', pagePath: '/users/students' },
        loadComponent: () => import('./features/users/users').then((m) => m.Users),
      },
      {
        path: 'users/staff',
        title: 'Staff · Paper Generator',
        canActivate: [permissionGuard('users.view')],
        data: { role: 'staff', pageTitle: 'Staff', pagePath: '/users/staff' },
        loadComponent: () => import('./features/users/users').then((m) => m.Users),
      },
      {
        path: 'roles',
        title: 'Roles & permissions · Paper Generator',
        canActivate: [permissionGuard('roles.view')],
        loadComponent: () => import('./features/roles/roles').then((m) => m.Roles),
      },
      {
        path: 'subjects',
        title: 'Subjects & Chapters · Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Subjects & Chapters',
          description: 'Organise your syllabus chapters and map them to classes and subjects.',
          icon: 'book-open',
        },
      },
      {
        path: 'questions/new',
        title: 'Add question - Paper Generator',
        canActivate: [permissionGuard('questions.manage')],
        loadComponent: () =>
          import('./features/questions/question-form').then((m) => m.QuestionForm),
      },
      {
        path: 'questions/:id/edit',
        title: 'Edit question - Paper Generator',
        canActivate: [permissionGuard('questions.manage')],
        loadComponent: () =>
          import('./features/questions/question-form').then((m) => m.QuestionForm),
      },
      {
        path: 'questions/:id',
        title: 'Question details - Paper Generator',
        canActivate: [permissionGuard('questions.view')],
        loadComponent: () =>
          import('./features/questions/question-detail').then((m) => m.QuestionDetail),
      },
      {
        path: 'questions',
        title: 'Question Bank - Paper Generator',
        canActivate: [permissionGuard('questions.view')],
        loadComponent: () => import('./features/questions/questions').then((m) => m.Questions),
      },
      {
        path: 'blueprints',
        title: 'Blueprints · Paper Generator',
        canActivate: [permissionGuard('blueprints.view')],
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Blueprints',
          description: 'Define section-wise marks distribution for every examination.',
          icon: 'layers',
        },
      },
      {
        path: 'papers/generate',
        title: 'Generate Paper · Paper Generator',
        canActivate: [permissionGuard('papers.manage')],
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Generate Paper',
          description: 'Pick a blueprint and generate a balanced, exam-ready question paper.',
          icon: 'file-plus',
        },
      },
      {
        path: 'papers',
        title: 'My Papers · Paper Generator',
        canActivate: [permissionGuard('papers.view')],
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'My Papers',
          description: 'Browse, edit and export every paper you have generated.',
          icon: 'file-text',
        },
      },
      {
        path: 'reports/class-students',
        title: 'Class & Student report · Paper Generator',
        canActivate: [permissionGuard('reports.view')],
        loadComponent: () =>
          import('./features/reports/class-student-report').then((m) => m.ClassStudentReport),
      },
      {
        path: 'reports',
        title: 'Reports · Paper Generator',
        canActivate: [permissionGuard('reports.view')],
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'masters/mediums',
        title: 'Mediums · Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () => import('./features/masters/mediums/mediums').then((m) => m.Mediums),
      },
      {
        path: 'masters/standards',
        title: 'Standards · Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () =>
          import('./features/masters/standards/standards').then((m) => m.Standards),
      },
      {
        path: 'masters/subjects',
        title: 'Subjects · Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () => import('./features/masters/subjects/subjects').then((m) => m.Subjects),
      },
      {
        path: 'masters/chapters',
        title: 'Chapters · Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () => import('./features/masters/chapters/chapters').then((m) => m.Chapters),
      },
      {
        path: 'masters/topics',
        title: 'Topics · Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () => import('./features/masters/topics/topics').then((m) => m.Topics),
      },
      {
        path: 'masters/question-types',
        title: 'Question Types · Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () =>
          import('./features/masters/question-types/question-types').then((m) => m.QuestionTypes),
      },
      {
        path: 'masters/difficulty-levels',
        title: 'Difficulty Levels · Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () =>
          import('./features/masters/difficulty-levels/difficulty-levels').then(
            (m) => m.DifficultyLevels,
          ),
      },
      {
        path: 'masters/bloom-levels',
        title: 'Bloom Levels — Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () =>
          import('./features/masters/bloom-levels/bloom-levels').then((m) => m.BloomLevels),
      },
      {
        path: 'masters/exam-types',
        title: 'Exam Types — Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () =>
          import('./features/masters/exam-types/exam-types').then((m) => m.ExamTypes),
      },
      {
        path: 'masters',
        title: 'Masters · Paper Generator',
        canActivate: [permissionGuard('masters.view')],
        loadComponent: () => import('./features/masters/masters').then((m) => m.Masters),
      },
      {
        path: 'classes',
        title: 'Classes & Students · Paper Generator',
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Classes & Students',
          description: 'Manage classes, sections and student rosters.',
          icon: 'users',
        },
      },
      {
        path: 'settings',
        title: 'Settings · Paper Generator',
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
