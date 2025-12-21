# Hello-Doctor Backend

A comprehensive Node.js backend API for healthcare management system with inventory management capabilities.

## 🚀 Features

- **Healthcare Management**: Complete patient and doctor management system
- **Inventory Management**: Track medical supplies, equipment, and pharmaceuticals
- **Multi-tenant Architecture**: Support for multiple healthcare facilities
- **Authentication & Authorization**: Secure JWT-based authentication
- **Database Management**: PostgreSQL with Sequelize ORM
- **Logging System**: Comprehensive logging with Winston
- **API Documentation**: RESTful API endpoints

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Logging**: Winston with daily rotate files
- **File Upload**: Multer
- **CORS**: Cross-Origin Resource Sharing enabled

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/Awresh/Hello-Doctor_Backend.git
cd Hello-Doctor_Backend
```

2. Install dependencies:
```bash
npm install
```

3. Environment Setup:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hello_doctor
DB_USER=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
PORT=3000
```

## 🚀 Getting Started

### Development Mode
```bash
npm run server
```

### Database Operations
```bash
# Sync database schema
npm run db:sync

# Test database connection
npm run db:test
```

## 📁 Project Structure

```
src/
├── config/          # Database and app configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware functions
├── models/          # Sequelize database models
├── routes/          # API route definitions
├── utils/           # Utility functions
├── logger/          # Logging configuration
├── scripts/         # Database scripts
└── seeds/           # Database seed files
```

## 🔧 API Endpoints

### Core Modules
- **Authentication**: User login/logout, JWT token management
- **User Management**: Patient and doctor profiles
- **Inventory Management**: Medical supplies tracking
- **Store Management**: Multi-location support
- **Reporting**: Stock and store reports

### Inventory Features
- Product & Service management
- Purchase tracking
- Stock management
- Supplier management
- Unit and category management
- Brand management

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:
- Users (Patients, Doctors, Admins)
- Inventory Items
- Stores/Locations
- Categories & Brands
- Purchase Records
- Stock Levels

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Input validation and sanitization
- Secure environment variable management

## 📝 Logging

Comprehensive logging system with:
- Application logs (`application-YYYY-MM-DD.log`)
- Error logs (`error-YYYY-MM-DD.log`)
- Daily log rotation
- Configurable log levels

## 🧪 Testing

```bash
npm test
```

## 📚 Documentation

Additional documentation available in:
- `docs/LOGGING.md` - Logging configuration and usage

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Author

**Mohd Awresh**

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.

---

**Hello-Doctor Backend** - Empowering healthcare management with robust technology solutions.