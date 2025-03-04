# Intro

The mobile app for Enaleia's operation and its partners, including recyclers and manufacturers, streamlines waste management and data tracking across the operational chain.

### Operational Flow
**1. At the Port:**
- Port coordinators weigh the fisherman’s waste collection and scan their Enaleia ID card.
- Data is submitted and attested using the port coordinator’s wallet, with transaction fees sponsored by a master wallet.

**2. Waste Collection Transportation:**
- When onsite containers reach capacity, the waste is shipped to the recycler.

**3. At the Recycler:**
- The recycler weighs the container using a weighbridge, generating a weight slip.
- The recycler sorts the materials and logs the sorted data with identifier codes in the app, submitting the data with an attestation.
- When raw materials like pellets are produced, the recycler records the quantity and makes a final attestation.

**4. To the Manufacturer:**
- Pellets are shipped to the manufacturer.
- The manufacturer records the production of end-user products, entering data and making attestations.

### Design Principles

The Enaleia Hub mobile app is designed with the users’ physical and digital constraints in mind:
- Offline-first approach: Recognizing limited internet access at many sites, the app operates offline, storing data locally until a connection is available for submission and attestation.
- Flexible UX: With operational workflows varying across countries, the user experience is designed to be generic, ensuring adaptability to different scenarios.


---------------------

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Environment

Make sure you have a .env file with the following content:
```
   EXPO_PUBLIC_API_URL = https://hq.enaleia.dev
```

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
