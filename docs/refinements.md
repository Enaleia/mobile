# Enaleia Mobile App Refinements

## Batch Fetcher Improvements ⏳

- ⏳ Update batch fetch queries to retrieve only necessary fields
  - ⏳ Determine necessary fields for the following collections: Collectors, Actions, User
- ⏳ Update collectors fetch to retrieve all entries, not just the first 100

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

- ⏳ Handle do not grant permission (exit modal)
- ⏳ Add context on why permission is needed

## Queue System Improvements ⏳

- ⏳ Remove completed tasks from the queue after 30 days
- ⏳ Investigate: "Retry all" button results in failure if network was offline, switched online and retry is attempted.
- ⏳ Make queue list scrollable
- ⏳ Display completed items section if there are any

## Auth Improvements ⏳

- ⏳ Offline: Allow users to login with previously used credentials
  - Show a banner to "Continue as [username]"
  - Show a button to "Continue as a different user"
  - Show a button to "Logout"
- ⏳ Don't sign out on app close if the user has an active session
- ✅ Contact support copy should link to: [contact suppport](app-support@enaleia.com)
- ⏳ Only sign out users who hit the "sign out" button
  - Allow users to leave the app and return and not have to sign in again.
- ✅ Login: Add feedback if only email or password is entered
- ✅ Login: Allow users to focus inputs by tapping their parent containers
- ✅ Login: Better error display for inputs and form
  - ✅ Simplified to single form-level error message at the top
  - ✅ Improved error messages to be more user-friendly
  - ✅ Added visual feedback with red borders on empty required fields
  - ✅ Clear error message when user starts typing

## Accessibility Improvements ⏳

### QR Scanner

- ➡️ Add voice guidance for scanning process (**FUTURE**)
- ⏳ Add haptic feedback for successful scans

--------------------------------------------------
--------------------------------------------------

## Implementation Status Legend

🟡 Partially Completed
⏳ Not Started
➡️ Future Consideration
✅ Completed

## Implementation Priority
### Critical
1. Session Management
   - Fix session persistence (don't sign out on app close)
   - Only sign out on explicit user action
2. Batch Fetcher Improvements
   - Update collectors fetch to retrieve all entries
### Important
1. Queue System
   - Complete the Queue page as per design
   - Make queue list scrollable
   - Fix "Retry all" button functionality
   - Display completed items section
   - Remove completed tasks after 30 days
### Nice to have
(Need to sort this section more, please address the critical and important ones)
2. iOS Form Issues (High Impact)
   - ✅ Fix material weights handling
   - ✅ Fix keyboard hiding inputs issue
   - ✅ Make inputs easier to focus by tapping parent containers
     - ✅ Weight inputs
     - ✅ Code inputs
   - ✅ Fix modal spacing in TypeInformationModal
   - ⏳ Fix QR code button crash
   - ⏳ Update QRCodeTextInput design consistency
   - ⏳ Address idle form error issue
3. Session Management
   - Implement offline login with previously used credentials
   - Fix session persistence (don't sign out on app close)
   - Only sign out on explicit user action
4. Batch Fetcher Improvements
   - Optimize queries to fetch only necessary fields
   - Update collectors fetch to retrieve all entries

5. Camera Permissions & Accessibility
   - Implement permission handling and context
   - Add haptic feedback for successful scans
