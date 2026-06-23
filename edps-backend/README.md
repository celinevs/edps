# Backend (Flask)

This project uses Flask as the backend framework and provides REST APIs for the application.

---

## Technology Stack

- Python 3.x
- Flask
- SQLAlchemy
- JWT Authentication
- Google OAuth
- MySQL

---

## Environment Variables

Create a `.env` file in the root directory:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET_KEY=your_jwt_secret_key
```

The following variables are provided through Docker Compose:

```env
FLASK_ENV=development
SECRET_KEY=devkey

MYSQL_HOST=db
MYSQL_PORT=3306
MYSQL_USER=flaskuser
MYSQL_PASSWORD=flaskpass
MYSQL_DB=flaskdb

DATABASE_URL=mysql+pymysql://flaskuser:flaskpass@db:3306/flaskdb

UPLOAD_FOLDER=/app/uploads
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Run the Application

Using Python:

```bash
python app.py
```

Or using Flask:

```bash
flask run
```

The application will be available at:

```text
http://localhost:5000
```

---

## File Upload Storage

Uploaded files are stored in:

```text
/app/uploads
```

When running with Docker, uploaded files are persisted through a Docker volume.

---

## Project Structure

```text
edps-backend/
│
├── app/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── uploads/
├── requirements.txt
├── Dockerfile
└── app.py
```

---

## API Access

Default API URL:

```text
http://localhost:5000
```

Example endpoints:

```http
GET /api/health
POST /api/auth/login
POST /api/auth/register
```

---

## Authentication

Authentication is implemented using JWT tokens.

Include the access token in the request header:

```http
Authorization: Bearer <access_token>
```

---

## External Integrations

### Google OAuth

Required environment variables:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

## Development

Install new packages:

```bash
pip install package-name
```

Update requirements:

```bash
pip freeze > requirements.txt
```
