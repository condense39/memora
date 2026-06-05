# Memora 📸
**An AI-powered event media sharing platform.**

Memora allows users to create events, bulk upload photos/videos, and uses AWS Rekognition to automatically tag and notify users when their face is detected in newly uploaded event media. 

## 🚀 Features

- **Event Management**: Create public or private (invite-only) events.
- **Bulk Upload**: Effortlessly drag-and-drop hundreds of photos directly to AWS S3.
- **AI Facial Recognition**: Upload a selfie to enroll in the system. The backend automatically scans new photos and notifies you via Pusher if you are found.
- **Privacy First**: Face scanning strictly adheres to event visibility and membership. You are only scanned in events you belong to.
- **Social Features**: Like, download, share, and comment on media. 
- **Google Vision Tagging**: Automatically detects labels and tags for all uploaded media.
- **Global Search**: Instantly search across all events, tags, and media.
- **Responsive UI**: Built with Tailwind CSS, featuring beautiful mobile-friendly layouts and drawers.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui (Radix), Lucide Icons
- **Backend**: Next.js API Routes, NextAuth.js v5
- **Database**: MongoDB & Mongoose
- **Storage**: AWS S3 (Presigned URLs for direct client uploads)
- **AI/ML**: AWS Rekognition (Face Matching & Collections), Google Cloud Vision (Image Labeling)
- **Realtime**: Pusher (WebSockets)

## 📦 Local Setup

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Create a `.env.local` file with the following keys:
   ```env
   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_super_secret_string

   # MongoDB
   MONGODB_URI=mongodb+srv://...

   # Google Auth & Vision
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

   # AWS S3 & Rekognition
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your_bucket_name
   AWS_REKOGNITION_COLLECTION_ID=memora-faces

   # Pusher
   NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_key
   NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
   PUSHER_APP_ID=your_pusher_app_id
   PUSHER_SECRET=your_pusher_secret
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```

## ☁️ Cloud Service Configurations

### AWS Configuration
Create an IAM User (`memora-backend`) with Programmatic Access and attach two policies:
1. `AmazonS3FullAccess`
2. `AmazonRekognitionFullAccess`

Configure your S3 bucket with the following CORS policy to allow direct frontend uploads:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
        "ExposeHeaders": []
    }
]
```

### Google Cloud Configuration
1. Enable the **Google Vision API** and **Google+ API** (for OAuth).
2. Create OAuth 2.0 Client IDs for NextAuth.
3. Create a Service Account for Vision API, generate a JSON key, and inline it into `GOOGLE_APPLICATION_CREDENTIALS_JSON`.

### Pusher Configuration
Create a Channels app on pusher.com. Copy the credentials into your `.env.local`. 

## 🔐 Role System

- **Global Admin**: Has unrestricted access to all events, members, and media. Can delete any photo or event.
- **Club Admin**: The creator of an event. Can edit event details, manage members, and delete any photo within their event.
- **Club Member**: Invited users. Can view private events, upload photos, and delete their own photos.
- **Viewer**: Public users viewing public events. Can only view and like/download. Cannot upload.
