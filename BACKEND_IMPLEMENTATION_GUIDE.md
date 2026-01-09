# Feature Access Control - Backend Implementation Guide

## ✅ What's Done

**Frontend:** 100% Complete
- Admin panel page at `/feature-access`
- 3 features configured: SOS (Quizzes), CONNECT (Clubs), CHALLENGE (Challenges)
- All UI components ready

## 🎯 What You Need

**Backend:** Give the prompt file to Claude

## 📝 The File to Give Claude

### → **[CLAUDE_BACKEND_PROMPT.md](CLAUDE_BACKEND_PROMPT.md)** ←

This file contains everything Claude needs to implement the backend:
- Complete context about the system
- Exact code for 4 files (model, controller, routes, seed)
- Access check logic with all edge cases
- Response formats
- Test commands
- Integration details

## 🚀 How to Use

1. **Open your backend project in Claude**

2. **Give Claude this exact message:**

```
Please implement the Feature Access Control system exactly as specified in the attached file CLAUDE_BACKEND_PROMPT.md.

Create these 4 files:
- models/FeatureAccess.js
- controllers/featureAccessController.js
- routes/featureAccessRoutes.js
- seeds/featureAccessSeed.js

And register the routes in the main app file.
```

3. **Attach the file:** `CLAUDE_BACKEND_PROMPT.md`

4. **Claude will implement everything** (2-3 hours)

## 📊 What Claude Will Create

### 1. Model (FeatureAccess)
- featureKey (SOS, CONNECT, CHALLENGE)
- requiresMembership (boolean)
- isActive (boolean)

### 2. Controller (3 methods)
- getAllFeatureAccess (GET - admin)
- updateFeatureAccess (PUT - admin)
- checkFeatureAccess (POST - public)

### 3. Routes
- GET /web/feature-access
- PUT /web/feature-access
- POST /web/feature-access/check

### 4. Seed Data
- Initial 3 features seeded to database

## 🧪 After Implementation

Test with these commands:

```bash
# 1. Get all features (needs admin token)
curl -X GET http://localhost:5000/api/web/feature-access \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 2. Update feature (needs admin token)
curl -X PUT http://localhost:5000/api/web/feature-access \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"featureKey":"SOS","requiresMembership":true,"isActive":true}'

# 3. Check access (public - no auth)
curl -X POST http://localhost:5000/api/web/feature-access/check \
  -H "Content-Type: application/json" \
  -d '{"featureKey":"SOS","phone":"+919876543210"}'
```

## ✅ Success Criteria

Backend is done when:
- ✅ GET endpoint returns 3 features
- ✅ PUT endpoint updates features
- ✅ POST check validates access correctly
- ✅ Admin panel save button works
- ✅ All 3 cURL tests pass

## 🎯 The 3 Features

1. **SOS** - Quizzes/SOS program
2. **CONNECT** - Clubs/community
3. **CHALLENGE** - Challenges/competitions

## 📁 Files in This Folder

- `CLAUDE_BACKEND_PROMPT.md` - **Give this to Claude**
- `BACKEND_IMPLEMENTATION_GUIDE.md` - This file (guide for you)
- Frontend code in `src/` folder (already complete)

## 🎊 That's It!

Just give `CLAUDE_BACKEND_PROMPT.md` to Claude and you're done!

The prompt is complete and self-contained. Claude has everything needed to implement the backend correctly.
