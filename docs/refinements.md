# Enaleia Mobile App Refinements

## Batch Fetcher Improvements ⏳

- ✅ Update batch fetch queries to retrieve only necessary fields
  - ⏳ Determine necessary fields for the following collections: Collectors, Actions, User
- ✅ [QUAN] Update collectors fetch to retrieve all entries, not just the first 100

## Attestation Form Improvements

- ✅ On Manufacturing form: Make product Weight and product quantity fields taller
- ✅ [iOS] If the material weights are absent, set the input value to null
- ✅ [iOS] Make the inputs visible even when they are further down on the page, so they are not hidden by the keyboard
- ✅ [iOS] [@/components/features/attest/TypeInformationModal] Give space between the modal and the native status bar so the close button is accessible. Maybe set a resonable max height on the modal?
- ✅ [iOS] Remove bottom padding of action selection page [ActionSelection.tsx, (tabs)/index]
- ⏳ [iOS] Investigate why clicking the QR code button in a selected material might result in an app crash
- ✅ [iOS] Update QRCodeTextInput to have a consistent design on iOS
- ✅ Investigate why leaving the form idle for a while and then returning to the submit to the queue might result in an error
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
  - ✅ Test scenarios:
    - ✅ Items moving to completed queue on completion
    - ✅ Loading performance with large completed queue
    - ✅ Background task handling of separate queues
    - ✅ Network recovery with separate queues
    - ✅ Memory usage with separate queues
    - ✅ Old cache cleanup functionality
  - ✅ Queue Processing Improvements
    - ✅ Verify items are saved before processing
    - ✅ Check both active and completed queues for verification
    - ✅ Better error handling and logging
    - ✅ Process items based on app state (foreground/background)

### Queue Page Redesign ✅

- ✅ Create queue utils for better status categorization
  - ✅ Move status checks to utils/queue.ts
  - ✅ Add helper functions for Processing/Pending/Failed states
  - ✅ Refactor existing queue logic to use new helpers
- ✅ Update UI Components
  - ✅ Create ProcessingPill with Reanimated pulse animation
  - ✅ Add red badge component for pending items count
  - ✅ Update QueueSection to use new categorization
  - ✅ Implement new section order (Processing > Pending > Failed > Completed)
- ✅ Add native notification system
  - ✅ Configure notification permissions for iOS and Android
  - ✅ Add notification for 5+ pending items
  - ✅ Add 5-minute cooldown to prevent notification spam
  - ✅ Handle notification permissions gracefully
  - ✅ Use high priority notifications with sound

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
- ✅ Token Refresh Improvements
  - ✅ Disable auto-refresh by default for better offline support
  - ✅ Add network-aware token refresh
  - ✅ Refresh tokens when coming back online
  - ✅ Check token expiration before attempting refresh
  - ✅ Use consistent token expiry key across the app
  - ✅ Test token and auth behavior in various scenarios:
    - ✅ Network state changes:
      - ✅ Going offline while logged in
      - ✅ Coming back online with valid token
      - ✅ Coming back online with expired token
      - ✅ API unreachable during refresh
    - ✅ Token lifecycle:
      - ✅ Token refresh while using the app
      - ✅ Token expiry during background task
      - ✅ Multiple devices logged in simultaneously
    - ✅ Queue processing:
      - ✅ Process queue after successful reauthorization
      - ✅ Process queue after failed reauthorization
      - ✅ Reauthorize while processing queue items
  - ✅ Token Management:
    - ✅ Store token expiry in SecureStore
    - ✅ Implement proactive refresh near expiry
    - ✅ Clear tokens only on explicit sign out
  - ✅ Background Task:
    - ✅ Keep 15-minute interval
    - ✅ Check token expiry before processing
    - ✅ Handle retries after failed auth
  - ✅ User Data:
    - ✅ Keep data until explicit sign out
    - ✅ Clear only via SignOutModal
    - ✅ Support offline capabilities

## Wallet Management ✅
### Implemented ✅
- ✅ Basic secure storage setup
  - Mnemonic (seed phrase)
  - Private key
  - Wallet address
- ✅ Wallet creation with mnemonic generation
- ✅ Private key derivation
- ✅ Network handling (sepolia/optimism)
- ✅ Wallet address sync with Directus user profile
  - Auto-sync on login/creation
  - Ownership verification
  - Automatic new wallet creation if verification fails
- ✅ Secure storage integration
  - Encrypted storage of keys
  - Proper state management
  - Error handling

### Pending ⏳
- ⏳ User interface for seed phrase management
  - Backup functionality
  - Download/export options
  - Recovery phrase verification
- ⏳ Enhanced security layer
  - Password-based encryption
  - Biometric authentication option
- ⏳ Wallet recovery flow
  - Import from seed phrase
  - Restore from backup
  - Validation and verification steps
- ⏳ Integration with Funding API (@unidwell/eas-lib)
  - Auto-request funds for new EOA wallets
  - Handle fund transfer from dedicated wallet
  - Add proper error handling and retries

## Attestation Weight Issues ✅
- ✅ Fix automatic "000" addition to weight during uint conversion
- ✅ Investigate and fix incorrect weight data transmission
- ✅ Fix missing company coordinates in EAS submission

## Wallet Integration Improvements ⏳
- ⏳ Implement wallet address sync with Directus user profile on login/creation
- ⏳ Add integration with Funding API (@unidwell/eas-lib)
  - Auto-request funds for new EOA wallets
  - Handle fund transfer from dedicated wallet
  - Add proper error handling and retries

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
   - ✅ Update batch fetch queries to retrieve only necessary fields
   - ✅ Update collectors fetch to retrieve all entries

### Important

1. iOS Form Issues (High Impact)
   - ⏳ Fix QR code button crash
   - ✅ Update QRCodeTextInput design consistency
   - ✅ Address idle form error issue
   - ✅ Remove bottom padding of action selection page

### Nice to have

1. Queue System Testing
   - ⏳ Complete test scenarios for queue storage separation
   - ⏳ Implement toast notification system
