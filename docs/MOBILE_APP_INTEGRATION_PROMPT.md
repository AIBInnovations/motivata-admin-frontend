# Mobile App Feature Access Integration Prompt

## Task Overview

Integrate feature access control for 3 features in the mobile app (React Native). The backend API is ready and you need to check user access before showing these features:

1. **SOS** - Quizzes feature
2. **CONNECT** - Clubs/community feature
3. **CHALLENGE** - Challenges feature

## Context

The admin panel can now control which features require active membership. When a user tries to access these features in the mobile app, you must:
1. Call the backend API to check access
2. If access granted → Show the feature
3. If access denied → Show appropriate message/upgrade prompt

## API Endpoint Details

### Check Feature Access

**Endpoint:** `POST /web/feature-access/check`

**Authentication:** Not required (public endpoint)

**Request Body:**
```json
{
  "featureKey": "SOS",
  "phone": "+919876543210"
}
```

**Response - Access Granted (Open to All):**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "reason": "OPEN_TO_ALL",
    "message": "Access granted"
  }
}
```

**Response - Access Granted (Valid Membership):**
```json
{
  "success": true,
  "data": {
    "hasAccess": true,
    "reason": "MEMBERSHIP_VALID",
    "message": "Access granted",
    "membership": {
      "planName": "Premium Membership",
      "endDate": "2024-12-31T23:59:59.999Z",
      "daysRemaining": 356
    }
  }
}
```

**Response - Access Denied (Feature Inactive):**
```json
{
  "success": true,
  "data": {
    "hasAccess": false,
    "reason": "FEATURE_INACTIVE",
    "message": "This feature is currently unavailable"
  }
}
```

**Response - Access Denied (No Membership):**
```json
{
  "success": true,
  "data": {
    "hasAccess": false,
    "reason": "NO_ACTIVE_MEMBERSHIP",
    "message": "This feature requires an active membership"
  }
}
```

## Implementation Steps

### Step 1: Create API Service

**File:** `services/featureAccessService.js`

```javascript
import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Check if user has access to a specific feature
 * @param {string} featureKey - 'SOS', 'CONNECT', or 'CHALLENGE'
 * @param {string} phone - User's phone number
 * @returns {Promise} API response
 */
export const checkFeatureAccess = async (featureKey, phone) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/web/feature-access/check`,
      {
        featureKey,
        phone,
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return {
      success: false,
      error: error.message || 'Failed to check feature access',
    };
  }
};
```

### Step 2: Create Access Check Hook (Optional but Recommended)

**File:** `hooks/useFeatureAccess.js`

```javascript
import { useState, useEffect } from 'react';
import { checkFeatureAccess } from '../services/featureAccessService';

/**
 * Hook to check feature access
 * @param {string} featureKey - Feature to check
 * @param {string} userPhone - User's phone number
 * @returns {Object} { hasAccess, isLoading, reason, error }
 */
export const useFeatureAccess = (featureKey, userPhone) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!featureKey || !userPhone) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const result = await checkFeatureAccess(featureKey, userPhone);

      if (result.success) {
        setHasAccess(result.data.hasAccess);
        setReason(result.data.reason);
      } else {
        setError(result.error);
        setHasAccess(false);
      }

      setIsLoading(false);
    };

    checkAccess();
  }, [featureKey, userPhone]);

  return { hasAccess, isLoading, reason, error };
};
```

### Step 3: Create Access Denied Component

**File:** `components/AccessDenied.js`

```javascript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * Component shown when access is denied
 * @param {string} reason - Denial reason ('FEATURE_INACTIVE' or 'NO_ACTIVE_MEMBERSHIP')
 * @param {Function} onUpgrade - Callback for upgrade button
 * @param {Function} onGoBack - Callback for go back button
 */
const AccessDenied = ({ reason, onUpgrade, onGoBack }) => {
  const isFeatureInactive = reason === 'FEATURE_INACTIVE';

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon
          name={isFeatureInactive ? 'alert-circle' : 'lock-closed'}
          size={80}
          color={isFeatureInactive ? '#EF4444' : '#F59E0B'}
        />
      </View>

      <Text style={styles.title}>
        {isFeatureInactive ? 'Feature Unavailable' : 'Membership Required'}
      </Text>

      <Text style={styles.message}>
        {isFeatureInactive
          ? 'This feature is currently unavailable. Please check back later or contact support.'
          : 'This feature requires an active membership. Upgrade your account to access exclusive features and content.'}
      </Text>

      <View style={styles.buttonContainer}>
        {!isFeatureInactive && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Text style={styles.upgradeButtonText}>View Membership Plans</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.backButton, isFeatureInactive && styles.backButtonSingle]}
          onPress={onGoBack}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  backButtonSingle: {
    backgroundColor: '#111827',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccessDenied;
```

### Step 4: Integrate in Feature Screens

#### Example 1: SOS/Quizzes Screen

**File:** `screens/QuizzesScreen.js`

```javascript
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import AccessDenied from '../components/AccessDenied';
import { useNavigation } from '@react-navigation/native';

const QuizzesScreen = ({ userPhone }) => {
  const navigation = useNavigation();
  const { hasAccess, isLoading, reason } = useFeatureAccess('SOS', userPhone);

  // Show loading while checking access
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  // Show access denied if no access
  if (!hasAccess) {
    return (
      <AccessDenied
        reason={reason}
        onUpgrade={() => navigation.navigate('Memberships')}
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  // Show actual quizzes content
  return (
    <View style={styles.container}>
      {/* Your actual SOS/Quizzes content here */}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default QuizzesScreen;
```

#### Example 2: Clubs Screen

**File:** `screens/ClubsScreen.js`

```javascript
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import AccessDenied from '../components/AccessDenied';
import { useNavigation } from '@react-navigation/native';

const ClubsScreen = ({ userPhone }) => {
  const navigation = useNavigation();
  const { hasAccess, isLoading, reason } = useFeatureAccess('CONNECT', userPhone);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <AccessDenied
        reason={reason}
        onUpgrade={() => navigation.navigate('Memberships')}
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Your actual Clubs content here */}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default ClubsScreen;
```

#### Example 3: Challenges Screen

**File:** `screens/ChallengesScreen.js`

```javascript
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import AccessDenied from '../components/AccessDenied';
import { useNavigation } from '@react-navigation/native';

const ChallengesScreen = ({ userPhone }) => {
  const navigation = useNavigation();
  const { hasAccess, isLoading, reason } = useFeatureAccess('CHALLENGE', userPhone);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <AccessDenied
        reason={reason}
        onUpgrade={() => navigation.navigate('Memberships')}
        onGoBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Your actual Challenges content here */}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default ChallengesScreen;
```

## Alternative: Manual Check (Without Hook)

If you prefer not to use hooks, you can check access manually:

```javascript
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { checkFeatureAccess } from '../services/featureAccessService';
import AccessDenied from '../components/AccessDenied';

const QuizzesScreen = ({ userPhone }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      const result = await checkFeatureAccess('SOS', userPhone);

      if (result.success) {
        setHasAccess(result.data.hasAccess);
        setReason(result.data.reason);
      } else {
        setHasAccess(false);
      }

      setIsLoading(false);
    };

    checkAccess();
  }, [userPhone]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <AccessDenied
        reason={reason}
        onUpgrade={() => {/* Navigate to memberships */}}
        onGoBack={() => {/* Navigate back */}}
      />
    );
  }

  return (
    <View>
      {/* Your content */}
    </View>
  );
};
```

## Feature Keys Reference

| Feature Key | Feature Name | Screen/Page |
|------------|--------------|-------------|
| `SOS` | Quizzes/SOS Program | QuizzesScreen |
| `CONNECT` | Clubs/Community | ClubsScreen |
| `CHALLENGE` | Challenges | ChallengesScreen |

## Access Denial Reasons

| Reason | Meaning | User Action |
|--------|---------|-------------|
| `FEATURE_INACTIVE` | Admin disabled the feature | Show "unavailable" message |
| `NO_ACTIVE_MEMBERSHIP` | User has no active membership | Show upgrade prompt |
| `OPEN_TO_ALL` | Feature is free | - (Access granted) |
| `MEMBERSHIP_VALID` | User has membership | - (Access granted) |

## Configuration

Make sure your API base URL is configured:

**File:** `config.js` or `.env`

```javascript
export const API_BASE_URL = 'http://your-api-url.com/api';
// or
// export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
```

## Testing Checklist

After implementation, test these scenarios:

1. **Feature Open to All:**
   - Admin sets SOS to "Open to All"
   - Any user can access Quizzes screen
   - No membership check

2. **Feature Requires Membership (User Has):**
   - Admin sets CONNECT to "Require Membership"
   - User with active membership can access Clubs
   - Shows content immediately

3. **Feature Requires Membership (User Doesn't Have):**
   - Admin sets CHALLENGE to "Require Membership"
   - User without membership sees upgrade prompt
   - Can navigate to membership plans

4. **Feature Disabled:**
   - Admin disables any feature
   - All users see "Feature Unavailable" message
   - No upgrade option shown

## Error Handling

Handle network errors gracefully:

```javascript
try {
  const result = await checkFeatureAccess('SOS', userPhone);

  if (!result.success) {
    // API error - show generic error or allow access
    console.error('Access check failed:', result.error);
    // You can choose to:
    // 1. Allow access (fail-open)
    // 2. Deny access (fail-closed)
    // 3. Show error message and retry option
  }
} catch (error) {
  // Network error - handle gracefully
  console.error('Network error:', error);
}
```

## Performance Optimization

**Cache Access Results (Optional):**

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'feature_access_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedAccess = async (featureKey, phone) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEY}_${featureKey}_${phone}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
};

const setCachedAccess = async (featureKey, phone, data) => {
  try {
    await AsyncStorage.setItem(
      `${CACHE_KEY}_${featureKey}_${phone}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch (error) {
    console.error('Cache write error:', error);
  }
};
```

## Summary

**What You Need to Implement:**

1. ✅ Create `featureAccessService.js` - API service
2. ✅ Create `useFeatureAccess.js` - Access check hook
3. ✅ Create `AccessDenied.js` - Denial UI component
4. ✅ Update 3 screens - Add access checks
   - QuizzesScreen (SOS)
   - ClubsScreen (CONNECT)
   - ChallengesScreen (CHALLENGE)

**The Flow:**

```
User opens feature screen
    ↓
Call checkFeatureAccess API
    ↓
API returns hasAccess: true/false
    ↓
If true → Show content
If false → Show AccessDenied component
```

**That's it!** The implementation is straightforward and follows standard React Native patterns.
