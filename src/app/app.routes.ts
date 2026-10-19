import { Routes } from '@angular/router';
import {
  adminAuthGuard,
  adminGuestGuard,
  authGuard,
  guestGuard,
  schoolAdminGuard,
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
        canActivate: [schoolAdminGuard],
        loadComponent: () => import('./features/users/user-form').then((m) => m.UserForm),
      },
      {
        path: 'users/:id/edit',
        title: 'Edit user · Paper Generator',
        canActivate: [schoolAdminGuard],
        loadComponent: () => import('./features/users/user-form').then((m) => m.UserForm),
      },
      {
        path: 'users',
        title: 'Users & Roles · Paper Generator',
        canActivate: [schoolAdminGuard],
        loadComponent: () => import('./features/users/users').then((m) => m.Users),
      },
      {
        path: 'subjects',
        title: 'Subjects & Chapters · Paper Generator',
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Subjects & Chapters',
          description: 'Organise your syllabus chapters and map them to classes and subjects.',
          icon: 'book-open',
        },
      },
      {
        path: 'questions',
        title: 'Question Bank · Paper Generator',
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Question Bank',
          description: 'Curate questions by chapter, type, difficulty and marks.',
          icon: 'help-circle',
        },
      },
      {
        path: 'blueprints',
        title: 'Blueprints · Paper Generator',
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
        loadComponent: () =>
          import('./features/reports/class-student-report').then((m) => m.ClassStudentReport),
      },
      {
        path: 'reports',
        title: 'Reports · Paper Generator',
        loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'masters/mediums',
        title: 'Mediums · Paper Generator',
        loadComponent: () => import('./features/masters/mediums/mediums').then((m) => m.Mediums),
      },
      {
        path: 'masters/standards',
        title: 'Standards · Paper Generator',
        loadComponent: () =>
          import('./features/masters/standards/standards').then((m) => m.Standards),
      },
      {
        path: 'masters/subjects',
        title: 'Subjects · Paper Generator',
        loadComponent: () => import('./features/masters/master-page').then((m) => m.MasterPage),
        data: {
          title: 'Subjects',
          description:
            'Manage subjects and map each one to the standards and mediums it is taught in.',
          icon: 'grid',
        },
      },
      {
        path: 'masters/chapters',
        title: 'Chapters · Paper Generator',
        loadComponent: () => import('./features/masters/master-page').then((m) => m.MasterPage),
        data: {
          title: 'Chapters',
          description: 'Map syllabus chapters to subjects so questions and papers stay organised.',
          icon: 'file-text',
        },
      },
      {
        path: 'masters/topics',
        title: 'Topics · Paper Generator',
        loadComponent: () => import('./features/masters/master-page').then((m) => m.MasterPage),
        data: {
          title: 'Topics',
          description:
            'Break chapters into tagged topics used for question mapping and paper blueprints.',
          icon: 'list',
        },
      },
      {
        path: 'masters/question-types',
        title: 'Question Types · Paper Generator',
        loadComponent: () => import('./features/masters/master-page').then((m) => m.MasterPage),
        data: {
          title: 'Question Types',
          description:
            'Define question formats such as MCQ, fill in the blanks, short and long answer.',
          icon: 'help-circle',
        },
      },
      {
        path: 'masters/difficulty-levels',
        title: 'Difficulty Levels · Paper Generator',
        loadComponent: () => import('./features/masters/master-page').then((m) => m.MasterPage),
        data: {
          title: 'Difficulty Levels',
          description:
            'Maintain difficulty levels used to balance papers during generation — easy, medium and hard.',
          icon: 'chart',
        },
      },
      {
        path: 'masters/bloom-levels',
        title: 'Bloom Levels · Paper Generator',
        loadComponent: () => import('./features/masters/master-page').then((m) => m.MasterPage),
        data: {
          title: 'Bloom Levels',
          description:
            "Maintain Bloom's taxonomy levels so every generated paper covers cognitive stages.",
          icon: 'target',
        },
      },
      {
        path: 'masters',
        title: 'Masters · Paper Generator',
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
        loadComponent: () =>
          import('./features/placeholder/placeholder').then((m) => m.Placeholder),
        data: {
          title: 'Settings',
          description: 'School profile, branding and account preferences.',
          icon: 'settings',
        },
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
