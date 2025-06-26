const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const {setupSwagger} = require('./config/swagger');
require('./config/database');

const { pool } = require('./config/database');

const userHomeRoutes = require('./routes/user/home');
const userEnquiryRoutes = require('./routes/user/enquiry');
const userRoutes = require('./routes/user/user');
const userStudentRoutes = require('./routes/user/student');
const userChatRoutes = require('./routes/user/chat');
const studentProfileRoutes = require('./routes/user/student');
const userBannerRoutes = require('./routes/user/banner');
const userNoticeBoardRoutes = require('./routes/user/noticeBoard');
const slidesRoutes = require('./routes/user/banner');
const userBlogRoutes = require('./routes/user/blog');
const currentAffairsRoutes = require('./routes/user/currentAffairs');
const userInstructorRoutes = require('./routes/user/instructor');
const userSettingsRoutes = require('./routes/user/settings');
const userLegalRoutes = require('./routes/user/legal');

const adminRoutes = require('./routes/admin/admin');
const adminAnnouncementRoutes = require('./routes/admin/announcement');
const adminBannerRoutes = require('./routes/admin/banner');
const adminBlogRoutes = require('./routes/admin/blog');
const adminCouponRoutes = require('./routes/admin/coupon');
const adminCourseRoutes = require('./routes/admin/course');
const adminCourseContentRoutes = require('./routes/admin/courseContent');
const adminCoursePricingRoutes = require('./routes/admin/coursePricing');
const adminCurrentAffairsRoutes = require('./routes/admin/currentAffairs');
const adminEnquiryRoutes = require('./routes/admin/enquiry');
const adminFacultyRoutes = require('./routes/admin/faculty');
const adminGalleryRoutes = require('./routes/admin/gallery');
const adminPrivacyRoutes = require('./routes/admin/privacy');
const adminTermsRoutes = require('./routes/admin/terms');
const adminStudentRoutes = require('./routes/admin/studentManagement');
const adminSettingRoutes = require('./routes/admin/setting');
const adminTestRoutes = require('./routes/admin/test');

const uploadsDir = path.join(__dirname, 'uploads');
const courseThumbsDir = path.join(__dirname, 'uploads/course-thumbnails');
const galleryDir = path.join(__dirname, 'public/uploads/gallery');
[uploadsDir, courseThumbsDir, galleryDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/gallery', express.static(path.join(__dirname, 'public/uploads/gallery')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/course-thumbnails', express.static(path.join(__dirname, 'uploads/course-thumbnails')));

const allowedOrigins = [
  'https://rvu-frontend.vercel.app',
  'https://rvu-frontend-git-master-tonys-projects-b0aa070e.vercel.app',
  'https://rvu-frontend-quvlqv6sp-tonys-projects-b0aa070e.vercel.app',
  /^https:\/\/rvu-frontend-.*\.vercel\.app$/,
  'http://localhost:4001',
  'http://127.0.0.1:4001',
  'http://localhost:5001',
  'http://127.0.0.1:5001'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      return allowedOrigin.test(origin);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'auth_key',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.options('*', (req, res) => {
  console.log(`OPTIONS ${req.path} from ${req.get('Origin')}`);
  res.header('Access-Control-Allow-Origin', req.get('Origin'));
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, auth_key, X-Requested-With, Accept, Origin, Cache-Control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(204);
});

app.set('trust proxy', 1);

app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(morgan('dev', {
  skip: function (req, res) {
    return req.path === '/health' || req.path === '/favicon.ico';
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));

app.get('/health', async (req, res) => {
  let dbStatus = 'unknown';
  let dbTables = 0;
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    const tableResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    dbTables = parseInt(tableResult.rows[0].count);
    dbStatus = 'connected';
    client.release();
  } catch (error) {
    dbStatus = 'disconnected';
    console.error('Health check DB error:', error.message);
  }
  
  res.header('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      tables: dbTables
    }
  });
});

app.get('/debug/uploads', (req, res) => {
  try {
    const thumbnailFiles = fs.existsSync(courseThumbsDir) ? fs.readdirSync(courseThumbsDir) : [];
    const galleryFiles = fs.existsSync(galleryDir) ? fs.readdirSync(galleryDir) : [];
    
    res.header('Access-Control-Allow-Origin', '*');
    res.json({
      message: 'Static files debug info',
      directories: {
        uploads: uploadsDir,
        courseThumbnails: courseThumbsDir,
        gallery: galleryDir
      },
      files: {
        thumbnails: thumbnailFiles.slice(0, 10), 
        gallery: galleryFiles.slice(0, 10)
      },
      sampleUrls: {
        thumbnail: thumbnailFiles.length > 0 ? `/uploads/course-thumbnails/${thumbnailFiles[0]}` : null,
        gallery: galleryFiles.length > 0 ? `/uploads/gallery/${galleryFiles[0]}` : null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

setupSwagger(app);

app.get('/api/cors-check', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.json({
    message: 'CORS is working!',
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
});

app.use('/api', userHomeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/student/profile', studentProfileRoutes);
app.use('/api/chat', userChatRoutes);
app.use('/api/settings', userSettingsRoutes);
app.use('/api/blogs', userBlogRoutes);
app.use('/api/contact-enquiry', userEnquiryRoutes);
app.use('/api/instructors', userInstructorRoutes);
app.use('/api/banners', userBannerRoutes);
app.use('/api/student', userStudentRoutes);
app.use('/api/current-affairs', currentAffairsRoutes);
app.use('/api/slides', slidesRoutes);
app.use('/api/legal', userLegalRoutes);
app.use('/api/notice-board', userNoticeBoardRoutes);

app.use('/api/admin/login', adminRoutes);
app.use('/api/admin/announcements', adminAnnouncementRoutes);
app.use('/api/admin/banners', adminBannerRoutes);
app.use('/api/admin/blogs', adminBlogRoutes);
app.use('/api/admin/coupons', adminCouponRoutes);
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/admin/course-content', adminCourseContentRoutes);
app.use('/api/admin/course-pricing', adminCoursePricingRoutes);
app.use('/api/admin/current-affairs', adminCurrentAffairsRoutes);
app.use('/api/admin/enquiries', adminEnquiryRoutes);
app.use('/api/admin/faculties', adminFacultyRoutes);
app.use('/api/admin/gallery', adminGalleryRoutes);
app.use('/api/admin/privacy', adminPrivacyRoutes);
app.use('/api/admin/terms', adminTermsRoutes);
app.use('/api/admin/students', adminStudentRoutes);
app.use('/api/admin/settings', adminSettingRoutes);
app.use('/api/admin/test', adminTestRoutes);

app.use((req, res, next) => {
  if (req.path.startsWith('/uploads/')) {
    console.log(`❌ 404 for upload file: ${req.path}`);
    console.log(`   Requested file: ${path.join(__dirname, req.path)}`);
    console.log(`   File exists: ${fs.existsSync(path.join(__dirname, req.path))}`);
  }
  
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    documentation: '/api-docs',
    availableRoutes: [
      'GET /health',
      'GET /api/cors-check',
      'GET /debug/uploads',
      'GET /api-docs'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Global error:', err.stack);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origin not allowed. Please check your domain configuration.',
      origin: req.get('Origin')
    });
  }
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;