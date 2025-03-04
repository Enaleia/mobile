# Enaleia Mobile App Refinements

## Batch Fetcher Improvements ⏳

- ⏳ Update batch fetch queries to retrieve only necessary fields
  - ⏳ Determine necessary fields for the following collections: Collectors, Actions, User
- ✅ [QUAN] Update collectors fetch to retrieve all entries, not just the first 100

## Attestation Form Improvements

- ✅ On Manufacturing form: Make product Weight and product quantity fields taller
- ✅ [iOS] If the material weights are absent, set the input value to null
- ✅ [iOS] Make the inputs visible even when they are further down on the page, so they are not hidden by the keyboard
- ✅ [iOS] [@/components/features/attest/TypeInformationModal] Give space between the modal and the native status bar so the close button is accessible. Maybe set a resonable max height on the modal?
- ⏳ [iOS] Remove bottom padding of action selection page [ActionSelection.tsx, (tabs)/index]
- ⏳ [iOS] Investigate why clicking the QR code button in a selected material might result in an app crash
- ⏳ [iOS] Update QRCodeTextInput to have a consistent design on iOS
- ⏳ Investigate why leaving the form idle for a while and then returning to the submit to the queue might result in an error
- ✅ Add an error message when not able to add to the queue (implemented as inline message with simplified UX)
- ✅ Create a reusable ErrorMessage component for consistent error display across the app
- ✅ Make it easier to focus inputs by tapping their parent containers
  - ✅ Implemented for weight inputs
  - ✅ Implemented for code inputs with QRTextInput ref forwarding

## Camera Permissions Improvements

- ✅ Handle do not grant permission (exit modal)
- ✅ Add context on why permission is needed
- ✅ Implement CameraEducationalModal
  - ✅ Create modal explaining camera usage for QR scanning
  - ✅ Add "Enable Camera" button to request permission
  - ✅ Add "Skip for Now" button to close modal
  - ✅ Use same visual style as LocationEducationalModal
  - ✅ Store permission seen status in AsyncStorage
- ✅ Update QRCodeScanner component
  - ✅ Integrate CameraEducationalModal
  - ✅ Check AsyncStorage for previous permission interaction
  - ✅ Show modal on first visit or when permission not granted
  - ✅ Handle permission states properly (granted/denied/skipped)
  - ✅ Ensure proper integration with QRTextInput
- ✅ Fix permission flow
  - ✅ When permission granted: proceed to scanner
  - ✅ When permission denied: close modal and scanner
  - ✅ When "Skip for Now": close modal and scanner
  - ✅ On subsequent QR button clicks: check permission status first

## Queue System Improvements

### Queue Storage Separation ✅
- ✅ Separate completed items into dedicated storage
  - ✅ Create new AsyncStorage keys for active and completed queues
  - ✅ Update QueueContext to handle dual storage
  - ✅ Add completion timestamp to completed items
  - ✅ Implement 30-day expiration cleanup
  - ✅ Add button to clear old cache data
  - ✅ Update related services:
    - ✅ Update backgroundTaskManager to use new storage
    - ✅ Update queueProcessor to handle completed items
    - ✅ Fix storage key imports across files
    - ✅ Update new action form to use active queue
  - ⏳ Test scenarios:
    - ⏳ Items moving to completed queue on completion
    - ⏳ Expired items cleanup (30+ days old)
    - ⏳ Loading performance with large completed queue
    - ⏳ Background task handling of separate queues
    - ⏳ Network recovery with separate queues
    - ⏳ Memory usage with separate queues
    - ⏳ Old cache cleanup functionality

### Queue Page Redesign 🟡
- ✅ Create queue utils for better status categorization
  - ✅ Move status checks to utils/queue.ts
  - ✅ Add helper functions for Processing/Pending/Failed states
  - ✅ Refactor existing queue logic to use new helpers
- 🟡 Update UI Components
  - ✅ Create ProcessingPill with Reanimated pulse animation
  - ✅ Add red badge component for pending items count
  - ✅ Update QueueSection to use new categorization
  - ✅ Implement new section order (Processing > Pending > Failed > Completed)
- ⏳ Add toast notification system
  - ⏳ Create toast component for 5+ pending items
  - ⏳ Add persistence for toast dismissal
  - ⏳ Implement toast visibility logic

### Queue System Fixes ✅
- ✅ Fix token expiration handling
  - ✅ Redirect to login when token expires
  - ✅ Update batchFetcher to handle token expiration gracefully
- ✅ Fix actions not showing in queue
  - ✅ Update useActions hook to handle query state properly
  - ✅ Add proper typing for BatchData
  - ✅ Ensure actions are available in queue items

## Auth Improvements ✅

- ✅ Offline: Allow users to login with previously used credentials
  - ✅ Automatically log in users when offline with stored credentials
  - ✅ Show offline mode notification
- ✅ Don't sign out on app close if the user has an active session
- ✅ Contact support copy should link to: [contact suppport](app-support@enaleia.com)
- ✅ Only sign out users who hit the "sign out" button
  - ✅ Allow users to leave the app and return and not have to sign in again.
- ✅ Login: Add feedback if only email or password is entered
- ✅ Login: Allow users to focus inputs by tapping their parent containers
- ✅ Login: Better error display for inputs and form
  - ✅ Simplified to single form-level error message at the top
  - ✅ Improved error messages to be more user-friendly
  - ✅ Added visual feedback with red borders on empty required fields
  - ✅ Clear error message when user starts typing
- 🟡 Token Refresh Improvements
  - ✅ Disable auto-refresh by default for better offline support
  - ✅ Add network-aware token refresh
  - ✅ Refresh tokens when coming back online
  - ⏳ Test reauthorization behavior in various scenarios:
    - ⏳ Test automatic reauthorization when network recovers
    - ⏳ Test reauthorization in background task
    - ⏳ Test reauthorization with invalid stored credentials
    - ⏳ Test reauthorization when API is unreachable
    - ⏳ Test reauthorization with expired token
    - ⏳ Test queue processing after successful reauthorization
    - ⏳ Test queue processing after failed reauthorization
    - ⏳ Test reauthorization while processing queue items
    - ⏳ Test reauthorization with multiple devices
  - ⏳ Test token refresh behavior in various scenarios:
    - ⏳ Going offline while logged in
    - ⏳ Coming back online with valid token
    - ⏳ Coming back online with expired token
    - ⏳ Token refresh while using the app
    - ⏳ Multiple devices logged in simultaneously

## Accessibility Improvements ⏳

### QR Scanner

- ➡️ Add voice guidance for scanning process (**FUTURE**)
- ✅ Add haptic feedback for successful scans

--------------------------------------------------
--------------------------------------------------

## Implementation Status Legend

🟡 Partially Completed
⏳ Not Started
➡️ Future Consideration
✅ Completed

## Implementation Priority

### Critical

1. Batch Fetcher Improvements
   - ⏳ Update batch fetch queries to retrieve only necessary fields
   - ✅ Update collectors fetch to retrieve all entries

### Important

1. iOS Form Issues (High Impact)
   - ⏳ Fix QR code button crash
   - ⏳ Update QRCodeTextInput design consistency
   - ⏳ Address idle form error issue
   - ⏳ Remove bottom padding of action selection page

### Nice to have

1. Queue System Testing
   - ⏳ Complete test scenarios for queue storage separation
   - ⏳ Implement toast notification system
