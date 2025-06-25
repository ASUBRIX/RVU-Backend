const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const {setupSwagger} = require('./config/swagger');
require('./config/database');

// Import the database pool for migration
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

// Auto-migration function
async function checkAndRunMigration() {
  let client;
  
  try {
    client = await pool.connect();
    console.log('🔍 Checking if database tables exist...');
    
    // Check if the users table exists
    const tableCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    const tableExists = parseInt(tableCheck.rows[0].count) > 0;
    
    if (!tableExists) {
      console.log('📋 Tables not found. Running auto-migration...');
      
      // Try to find the migration file in different possible locations
      const possiblePaths = [
        path.join(__dirname, 'db/init.sql'),
        path.join(__dirname, 'database/init.sql'),
        path.join(__dirname, 'database/migration.sql'),
        path.join(__dirname, 'scripts/init.sql')
      ];
      
      let sqlPath = null;
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          sqlPath = p;
          break;
        }
      }
      
      if (sqlPath) {
        console.log(`📖 Found migration file at: ${sqlPath}`);
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('🔄 Executing migration...');
        await client.query('BEGIN');
        await client.query(sqlContent);
        await client.query('COMMIT');
        
        console.log('✅ Auto-migration completed successfully!');
        
        // Verify tables were created
        const result = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `);
        
        console.log(`🎉 Created ${result.rows.length} tables:`, result.rows.map(r => r.table_name).join(', '));
        
      } else {
        console.log('⚠️ Migration file not found. Looked in:');
        possiblePaths.forEach(p => console.log(`   - ${p}`));
        console.log('Please create a migration file with your database schema.');
      }
    } else {
      console.log('✅ Database tables already exist');
      
      // Log existing tables for verification
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log(`📊 Found ${result.rows.length} existing tables`);
    }
    
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ Rollback failed:', rollbackError.message);
      }
    }
    console.error('❌ Auto-migration failed:', error.message);
    console.error('🔧 This might be expected if running locally. Check your database connection.');
    // Don't crash the app in production - just log the error
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Create upload directories
const uploadsDir = path.join(__dirname, 'uploads');
const courseThumbsDir = path.join(__dirname, 'uploads/course-thumbnails');
const galleryDir = path.join(__dirname, 'public/uploads/gallery');
[uploadsDir, courseThumbsDir, galleryDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads/gallery', express.static(path.join(__dirname, 'public/uploads/gallery')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/course-thumbnails', express.static(path.join(__dirname, 'uploads/course-thumbnails')));

// CORS Configuration - Fixed
const allowedOrigins = [
  // Production domains (REMOVE trailing slashes!)
  'https://rvu-frontend.vercel.app',
  'https://rvu-frontend-git-master-tonys-projects-b0aa070e.vercel.app',
  'https://rvu-frontend-quvlqv6sp-tonys-projects-b0aa070e.vercel.app',
  
  // Vercel preview deployments pattern
  /^https:\/\/rvu-frontend-.*\.vercel\.app$/,
  
  // Development
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

// Enhanced CORS setup
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      }
      // For regex patterns
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
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Middleware setup
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Morgan logging (skip health checks)
app.use(morgan('combined', {
  skip: function (req, res) {
    return req.path === '/health' || req.path === '/favicon.ico';
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));

// Health check endpoint with database status
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

// Database migration endpoint (for manual trigger)
app.get('/api/migrate', async (req, res) => {
  try {
    await checkAndRunMigration();
    res.json({
      success: true,
      message: 'Migration check completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint for uploads
app.get('/debug/uploads', (req, res) => {
  try {
    const thumbnailFiles = fs.existsSync(courseThumbsDir) ? fs.readdirSync(courseThumbsDir) : [];
    const galleryFiles = fs.existsSync(galleryDir) ? fs.readdirSync(galleryDir) : [];
    
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

// Setup Swagger documentation
setupSwagger(app);

// API endpoint to check CORS
app.get('/api/cors-check', (req, res) => {
  res.json({
    message: 'CORS is working!',
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
});

// User routes
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

// Admin routes
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

// 404 handler
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
      'GET /api/migrate',
      'GET /debug/uploads',
      'GET /api-docs'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err.stack);
  
  // CORS error
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


if (process.env.NODE_ENV === 'production' || process.env.RUN_MIGRATION === 'true') {
  setTimeout(() => {
    checkAndRunMigration();
  }, 2000);
}

module.exports = app;