# Fleetio — Fleet Management App

Expo (mobile + web) fleet management app with Convex backend.

## Fresh Machine Setup (Linux)

### 1. System packages

```bash
# Fedora
sudo dnf install java-17-openjdk-devel git curl unzip

# Ubuntu/Debian
sudo apt update && sudo apt install openjdk-17-jdk git curl unzip

# Arch
sudo pacman -S jdk17-openjdk git curl unzip
```

Verify Java 17:
```bash
java -version
javac -version
```

### 2. Node.js 22 (via nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
# restart terminal
nvm install 22
nvm use 22
nvm alias default 22
```

Verify:
```bash
node -v
npm -v
```

### 3. pnpm

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

### 4. Android SDK

Install [Android command-line tools](https://developer.android.com/studio#command-tools) to `~/android-sdk`:

```bash
mkdir -p ~/android-sdk/cmdline-tools
# download + extract cmdline-tools to ~/android-sdk/cmdline-tools/latest
# download + extract platform-tools to ~/android-sdk/platform-tools
```

Configure environment (add to `~/.bashrc` or `~/.zshrc`):

```bash
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
```

Reload shell and verify:
```bash
source ~/.bashrc
which sdkmanager
which adb
```

Install required SDK packages (adjust versions to your project's `android/` config):

```bash
sdkmanager "platforms;android-34" "build-tools;34.0.0" "ndk;26.3.11579264"
yes | sdkmanager --licenses
```

### 5. Clone & install

```bash
git clone <your-repo-url>
cd fleetio
pnpm install
```

### 6. Environment files

Create from your secrets source (not committed to Git):
```bash
# Development
cp .env.local.example .env.local   # or create manually

# Production
cp .env.production.example .env.production  # or create manually
```

Required variables: `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_CONVEX_SITE_URL`, `BETTER_AUTH_SECRET`, `EMAIL_DOMAIN`

### 7. Convex (development)

```bash
npx convex dev
```

### 8. Connect device

```bash
adb devices
# Should show: XXXXXXXX    device
# If "unauthorized", accept RSA prompt on phone
```

---

## Building & installing the APK

### Build

Run `build-apk.sh` from the project root, choosing an environment:

```bash
./build-apk.sh dev    # uses .env.local       → fleetio.dev.apk
./build-apk.sh prod   # uses .env.production  → fleetio.prod.apk
```

Notes:
- `prod` builds **deploy the Convex backend first** (`npx convex deploy` to the production deployment), so the APK ships with the latest functions/schema. Dev builds skip this — they talk to the local dev server.
- The env file is baked into the JS bundle (`EXPO_PUBLIC_CONVEX_URL`, ...), so a rebuild is required to switch environments.
- The `gradlew` daemon is stopped before building so the new env vars aren't frozen out by a stale daemon.
- Output APK lands in the repo root as `fleetio.<mode>.apk`.

### Install

Plug in your phone with USB debugging enabled ([enable it in Developer Options](https://developer.android.com/studio/run/device#developer-device-options)), then:

```bash
adb devices          # confirm the phone is listed (not "unauthorized")
adb install fleetio.prod.apk
```

Useful flags:
- `-r` reinstall and keep app data: `adb install -r fleetio.prod.apk`
- `-d` allow downgrade (pair with `-r`): `adb install -rd fleetio.prod.apk`
- `-g` grant all runtime permissions at install time

If `adb devices` shows `unauthorized`, accept the RSA debug prompt on your phone.

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

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

https://easyappicon.com/

https://allicons-generator.vercel.app/
